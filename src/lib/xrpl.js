import { Wallet, Client, escrowCancel, escrowFinish, escrowCreate } from "xrpl";

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

let client = null;

export async function getClient() {
  if (!client) {
    client = new Client(TESTNET_URL);
    await client.connect();
  }
  return client;
}

export async function getWalletFromSeed(seed) {
  const wallet = Wallet.fromSeed(seed);
  return wallet;
}

export async function createTestWallet() {
  const client = await getClient();
  const wallet = await client.fundWallet();
  return wallet;
}

export async function createEscrow({
  senderWallet,
  amount,
  recipient,
  finishAfter = null,
  cancelAfter = null,
}) {
  const client = await getClient();

  const escrowTx = {
    TransactionType: "EscrowCreate",
    Account: senderWallet.address,
    Destination: recipient,
    Amount: amount,
  };

  if (finishAfter) {
    escrowTx.FinishAfter = finishAfter;
  }

  if (cancelAfter) {
    escrowTx.CancelAfter = cancelAfter;
  }

  const result = await client.submitAndWait(escrowTx, { wallet: senderWallet });

  const escrowSequence = result.result.meta.Affections[0].CreatedNode?.NewFields?.Sequence;
  
  return {
    txHash: result.result.hash,
    escrowSequence,
    success: result.result.meta.TransactionResult === "tesSUCCESS",
  };
}

export async function finishEscrow({
  senderWallet,
  recipientWallet,
  escrowSequence,
  ownerAddress = null,
}) {
  const client = await getClient();

  const finishTx = {
    TransactionType: "EscrowFinish",
    Account: recipientWallet.address,
    Owner: ownerAddress || senderWallet.address,
    OfferSequence: escrowSequence,
  };

  const result = await client.submitAndWait(finishTx, { wallet: recipientWallet });

  return {
    txHash: result.result.hash,
    success: result.result.meta.TransactionResult === "tesSUCCESS",
  };
}

export async function cancelEscrow({
  senderWallet,
  escrowSequence,
  ownerAddress = null,
}) {
  const client = await getClient();

  const cancelTx = {
    TransactionType: "EscrowCancel",
    Account: senderWallet.address,
    Owner: ownerAddress || senderWallet.address,
    OfferSequence: escrowSequence,
  };

  const result = await client.submitAndWait(cancelTx, { wallet: senderWallet });

  return {
    txHash: result.result.hash,
    success: result.result.meta.TransactionResult === "tesSUCCESS",
  };
}

export async function getEscrows(address) {
  const client = await getClient();

  const response = await client.request({
    command: "account_objects",
    account: address,
    type: "escrow",
  });

  return response.result.account_objects;
}

export async function getAccountInfo(address) {
  const client = await getClient();
  const info = await client.request({
    command: "account_info",
    account: address,
  });
  return info.result.account_data;
}

export async function getBalance(address) {
  const info = await getAccountInfo(address);
  return info.Balance;
}

export function disconnectClient() {
  if (client) {
    client.disconnect();
    client = null;
  }
}
