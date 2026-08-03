// supabase/functions/buy-ticket/index.ts
//
// This is the heart of "wallet-less onboarding": the buyer never sees a
// Stellar address, a seed phrase, or a wallet extension. They just POST
// {email, event_id, ticket_no} and get back a ticket.
//
// What happens inside, step by step:
//   1. Look up (or create) a Stellar keypair for this email — the buyer's
//      "wallet," created and held entirely by us.
//   2. Fund that new account on testnet via Friendbot (real accounts need a
//      minimum XLM balance to exist on Stellar — Friendbot is testnet-only
//      free test money for exactly this purpose).
//   3. Call mint_ticket on the deployed contract, signed by the organizer
//      key we hold, with the buyer's address as the new owner.
//   4. Record the ticket in our database for fast lookups later.

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
import { encryptSecret } from "../_shared/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORGANIZER_SECRET_KEY = Deno.env.get("ORGANIZER_SECRET_KEY")!;
const CONTRACT_ID = Deno.env.get("CONTRACT_ID")!;
const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY")!;
const RPC_URL = Deno.env.get("STELLAR_RPC_URL") ?? "https://soroban-testnet.stellar.org";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const server = new rpc.Server(RPC_URL);

async function getOrCreateBuyerWallet(email: string) {
  const { data: existing } = await supabase
    .from("buyer_wallets")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) return existing;

  // No wallet yet for this email — create one silently.
  const keypair = Keypair.random();

  // Fund it on testnet so the account actually exists on-chain.
  const fundRes = await fetch(
    `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
  );
  if (!fundRes.ok) {
    throw new Error(`Friendbot funding failed: ${await fundRes.text()}`);
  }

  const encrypted = await encryptSecret(keypair.secret(), ENCRYPTION_KEY);

  const { data: inserted, error } = await supabase
    .from("buyer_wallets")
    .insert({
      email,
      stellar_public_key: keypair.publicKey(),
      encrypted_secret: encrypted,
    })
    .select()
    .single();

  if (error) throw error;
  return inserted;
}

async function mintTicketOnChain(
  eventId: number,
  ticketNo: number,
  buyerPublicKey: string
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
        "mint_ticket",
        new Address(organizerKeypair.publicKey()).toScVal(),
        nativeToScVal(eventId, { type: "u64" }),
        nativeToScVal(ticketNo, { type: "u64" }),
        new Address(buyerPublicKey).toScVal()
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

  // Poll until the transaction is confirmed.
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
  // CORS: browsers send a preflight OPTIONS request before the real POST,
  // and expect these headers on every response (including errors) to allow
  // a page running on a different origin (like localhost:5173) to call
  // this function. curl doesn't need this — only browsers enforce it,
  // which is why our earlier curl tests worked but the browser didn't.
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, event_id, ticket_no, purchase_price_stroops } = await req.json();

    if (!email || event_id == null || ticket_no == null) {
      return new Response(
        JSON.stringify({ error: "email, event_id, and ticket_no are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wallet = await getOrCreateBuyerWallet(email);
    const txHash = await mintTicketOnChain(event_id, ticket_no, wallet.stellar_public_key);

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        event_id,
        ticket_no,
        buyer_wallet_id: wallet.id,
        purchase_price_stroops: purchase_price_stroops ?? 0,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    await supabase.from("activity_log").insert({
      kind: "mint",
      event_id,
      ticket_no,
      detail: `tx ${txHash}`,
    });

    return new Response(JSON.stringify({ ticket, tx_hash: txHash }), {
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