import PinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";

const PINATA_JWT = process.env.PINATA_JWT || process.env.PINATA_API_KEY;
const GATEWAY_URL = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

let pinata = null;

export function getPinata() {
  if (!pinata && PINATA_JWT) {
    pinata = new PinataSDK({ pinataJwt: PINATA_JWT });
  }
  return pinata;
}

export function getGatewayUrl(cid) {
  return `${GATEWAY_URL}/${cid}`;
}

export async function uploadFile(filePath, keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured. Set PINATA_JWT environment variable.");
  }

  const result = await p.upload.public.file(filePath, { keyvalues });
  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Date,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
  };
}

export async function uploadBuffer(buffer, filename, keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured. Set PINATA_JWT environment variable.");
  }

  const result = await p.upload.public.buffer(buffer, {
    pinataMetadata: { name: filename },
    pinataOptions: { keyvalues },
  });

  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Date,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
  };
}

export async function uploadJSON(data, keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured. Set PINATA_JWT environment variable.");
  }

  const result = await p.upload.public.json(data, { keyvalues });

  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Date,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
  };
}

export async function listFiles(keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured. Set PINATA_JWT environment variable.");
  }

  const filters = Object.entries(keyvalues).map(([key, value]) => ({
    key,
    value,
  }));

  const result = await p.publicGatewayList(filters);

  return result.rows.map((row) => ({
    cid: row.ipfs_pin_hash,
    name: row.metadata.name,
    keyvalues: row.keyvalues,
    size: row.size,
    timestamp: row.date_unpinned,
  }));
}

export async function getFilesByChallenge(challengeId) {
  return listFiles({ challengeId });
}

export async function getFilesBySolver(solver) {
  return listFiles({ solver });
}

export async function pinCID(cid) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured.");
  }

  const result = await p.pinByHash(cid);
  return result;
}

export async function unpin(cid) {
  const p = getPinata();
  if (!p) {
    throw new Error("Pinata not configured.");
  }

  const result = await p.unpin(cid);
  return result;
}
