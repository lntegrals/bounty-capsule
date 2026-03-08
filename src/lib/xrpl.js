import { Wallet, Client } from "xrpl";

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

let client = null;

export async function getClient() {
  if (!client || !client.isConnected()) {
    client = new Client(TESTNET_URL, { connectionTimeout: 15000 });
    await client.connect();
  }
  return client;
}

/** Convert XRP (human-readable float) to drops (integer string) */
export function xrpToDrops(xrp) {
  return String(Math.floor(parseFloat(xrp) * 1_000_000));
}

/** Convert drops to XRP for display */
export function dropsToXrp(drops) {
  return (parseInt(drops, 10) / 1_000_000).toString();
}

export async function getWalletFromSeed(seed) {
  return Wallet.fromSeed(seed);
}

export async function createTestWallet() {
  const c = await getClient();
  const result = await c.fundWallet();
  return result;
}

export async function createEscrow({
  senderWallet,
  amount,        // XRP amount as string or number
  recipient,
  finishAfter = null,
  cancelAfter = null,
}) {
  const c = await getClient();

  const amountInDrops = xrpToDrops(amount);

  const escrowTx = {
    TransactionType: "EscrowCreate",
    Account: senderWallet.address,
    Destination: recipient,
    Amount: amountInDrops,
  };

  if (finishAfter) escrowTx.FinishAfter = finishAfter;
  if (cancelAfter) escrowTx.CancelAfter = cancelAfter;

  const result = await c.submitAndWait(escrowTx, { wallet: senderWallet });

  // The escrow sequence == the EscrowCreate transaction's own Sequence number.
  // We also try AffectedNodes as belt-and-suspenders.
  const txSequence = result.result.Sequence;
  const affectedNodes = result.result.meta?.AffectedNodes || [];
  const escrowNode = affectedNodes.find(
    (n) => n.CreatedNode?.LedgerEntryType === "Escrow"
  );
  const escrowSequence =
    escrowNode?.CreatedNode?.NewFields?.Sequence ?? txSequence;

  return {
    txHash: result.result.hash,
    escrowSequence,
    amountDrops: amountInDrops,
    success: result.result.meta?.TransactionResult === "tesSUCCESS",
  };
}

export async function finishEscrow({
  senderWallet,
  escrowSequence,
  ownerAddress = null,
}) {
  const c = await getClient();

  // The issuer (challenge creator) can finish unconditional escrows.
  const finishTx = {
    TransactionType: "EscrowFinish",
    Account: senderWallet.address,
    Owner: ownerAddress || senderWallet.address,
    OfferSequence: escrowSequence,
  };

  const result = await c.submitAndWait(finishTx, { wallet: senderWallet });

  return {
    txHash: result.result.hash,
    success: result.result.meta?.TransactionResult === "tesSUCCESS",
  };
}

export async function cancelEscrow({
  senderWallet,
  escrowSequence,
  ownerAddress = null,
}) {
  const c = await getClient();

  const cancelTx = {
    TransactionType: "EscrowCancel",
    Account: senderWallet.address,
    Owner: ownerAddress || senderWallet.address,
    OfferSequence: escrowSequence,
  };

  const result = await c.submitAndWait(cancelTx, { wallet: senderWallet });

  return {
    txHash: result.result.hash,
    success: result.result.meta?.TransactionResult === "tesSUCCESS",
  };
}

export async function getEscrows(address) {
  const c = await getClient();
  const response = await c.request({
    command: "account_objects",
    account: address,
    type: "escrow",
  });
  return response.result.account_objects;
}

export async function getAccountInfo(address) {
  const c = await getClient();
  const info = await c.request({
    command: "account_info",
    account: address,
  });
  return info.result.account_data;
}

export async function getBalance(address) {
  const info = await getAccountInfo(address);
  // Balance is in drops — return XRP for display
  return dropsToXrp(info.Balance);
}

export function disconnectClient() {
  if (client) {
    client.disconnect();
    client = null;
  }
}
