// supabase/functions/verify-ticket/index.ts
//
// This is what runs when gate staff scan a QR code. It calls verify_ticket
// on the contract (signed by the organizer key), which atomically checks
// the ticket is valid AND marks it used in the same on-chain call — so two
// staff scanning the same screenshotted QR can't both let someone in.

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

async function verifyTicketOnChain(eventId: number, ticketNo: number) {
  const organizerKeypair = Keypair.fromSecret(ORGANIZER_SECRET_KEY);
  const account = await server.getAccount(organizerKeypair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "verify_ticket",
        new Address(organizerKeypair.publicKey()).toScVal(),
        nativeToScVal(eventId, { type: "u64" }),
        nativeToScVal(ticketNo, { type: "u64" })
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

  return sendResult.hash;
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
    const { event_id, ticket_no } = await req.json();

    if (event_id == null || ticket_no == null) {
      return new Response(
        JSON.stringify({ error: "event_id and ticket_no are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txHash = await verifyTicketOnChain(event_id, ticket_no);

    await supabase
      .from("tickets")
      .update({ used: true })
      .eq("event_id", event_id)
      .eq("ticket_no", ticket_no);

    await supabase.from("activity_log").insert({
      kind: "verify",
      event_id,
      ticket_no,
      detail: `tx ${txHash}`,
    });

    return new Response(JSON.stringify({ valid: true, tx_hash: txHash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = String(err);
    // TicketAlreadyUsed is contract error #6 — this is an *expected* outcome
    // (someone tried to reuse a ticket), not a server malfunction, so we
    // report it clearly rather than as a generic failure.
    const alreadyUsed = message.includes("Error(Contract, #6)");
    await supabase.from("activity_log").insert({
      kind: "block",
      detail: alreadyUsed ? "duplicate scan blocked" : message,
    });

    console.error(err);
    return new Response(
      JSON.stringify({
        valid: false,
        reason: alreadyUsed ? "Ticket already used" : "Verification failed",
        error: message,
      }),
      { status: alreadyUsed ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});