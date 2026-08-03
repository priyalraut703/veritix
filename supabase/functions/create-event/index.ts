// supabase/functions/create-event/index.ts
//
// Lets an organizer create an event from the UI instead of the CLI.
// Calls create_event on the contract (signed by the organizer key), then
// mirrors the event into Supabase so it shows up on the Browse page.
//
// Note: for this MVP, every event is created under the one organizer key
// the whole app shares (the same "alice" identity you set up earlier).
// Multi-organizer support (each fest committee having their own key) is a
// natural next step, not needed to prove the concept.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
} from "npm:@stellar/stellar-sdk";
import { rpc } from "npm:@stellar/stellar-sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORGANIZER_SECRET_KEY = Deno.env.get("ORGANIZER_SECRET_KEY")!;
const CONTRACT_ID = Deno.env.get("CONTRACT_ID")!;
const RPC_URL = Deno.env.get("STELLAR_RPC_URL") ?? "https://soroban-testnet.stellar.org";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const server = new rpc.Server(RPC_URL);

async function nextEventId(): Promise<number> {
  const { data } = await supabase
    .from("events")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].id + 1 : 1;
}

async function createEventOnChain(
  eventId: number,
  name: string,
  facePriceStroops: number,
  maxResaleBps: number
) {
  const organizerKeypair = Keypair.fromSecret(ORGANIZER_SECRET_KEY);
  const account = await server.getAccount(organizerKeypair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "create_event",
        new Address(organizerKeypair.publicKey()).toScVal(),
        nativeToScVal(eventId, { type: "u64" }),
        nativeToScVal(name, { type: "string" }),
        nativeToScVal(facePriceStroops, { type: "i128" }),
        nativeToScVal(maxResaleBps, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(organizerKeypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Contract call failed: ${JSON.stringify(sendResult)}`);
  }

  let getResult = await server.getTransaction(sendResult.hash);
  let attempts = 0;
  while (getResult.status === "NOT_FOUND" && attempts < 15) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
    attempts++;
  }

  if (getResult.status !== "SUCCESS") {
    throw new Error(`Transaction did not succeed: ${JSON.stringify(getResult)}`);
  }

  return { hash: sendResult.hash, organizerAddress: organizerKeypair.publicKey() };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, venue, face_price_xlm, max_resale_bps } = await req.json();

    if (!name || face_price_xlm == null) {
      return new Response(
        JSON.stringify({ error: "name and face_price_xlm are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventId = await nextEventId();
    const facePriceStroops = Math.round(Number(face_price_xlm) * 10_000_000);
    const resaleBps = max_resale_bps ?? 12000;

    const { hash, organizerAddress } = await createEventOnChain(
      eventId,
      name,
      facePriceStroops,
      resaleBps
    );

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        id: eventId,
        organizer_address: organizerAddress,
        name,
        venue: venue ?? null,
        face_price_stroops: facePriceStroops,
        max_resale_bps: resaleBps,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ event, tx_hash: hash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});