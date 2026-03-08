import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";
import crypto from "crypto";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const GATEWAY_URL = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

/** Generate a deterministic mock CID from content when Pinata is not configured */
function mockCID(data) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  // Produce a Qm-prefixed CID-looking string (not a real IPFS CID, but looks like one)
  return `Qm${hash.slice(0, 44)}`;
}

let pinata = null;

export function getPinata() {
  if (pinata) return pinata;

  if (PINATA_JWT) {
    // JWT auth — correct key name for @pinata/sdk v2
    pinata = new PinataSDK({ pinataJWTKey: PINATA_JWT });
  } else if (PINATA_API_KEY && PINATA_API_SECRET) {
    // API key + secret fallback
    pinata = new PinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
  }

  return pinata;
}

export function getGatewayUrl(cid) {
  return `${GATEWAY_URL}/${cid}`;
}

/** Test auth credentials on startup — call once at server init */
export async function testPinataAuth() {
  const p = getPinata();
  if (!p) {
    console.warn("[Pinata] Not configured — set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET");
    return false;
  }
  try {
    await p.testAuthentication();
    console.log("[Pinata] Auth OK");
    return true;
  } catch (e) {
    console.error("[Pinata] Auth failed:", e.message);
    return false;
  }
}

export async function uploadBuffer(buffer, filename, keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    console.warn("[Pinata] Not configured — storing without IPFS. Set PINATA_JWT to enable.");
    const cid = mockCID({ filename, keyvalues, ts: Date.now() });
    return { cid, size: buffer.length || 0, timestamp: new Date().toISOString(), gatewayUrl: null, local: true };
  }

  const stream = Readable.from(buffer);
  stream.path = filename; // required for SDK to infer filename

  const result = await p.pinFileToIPFS(stream, {
    pinataMetadata: { name: filename, keyvalues },
  });

  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Timestamp,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
  };
}

export async function uploadJSON(data, keyvalues = {}) {
  const p = getPinata();
  if (!p) {
    console.warn("[Pinata] Not configured — storing without IPFS. Set PINATA_JWT to enable.");
    const cid = mockCID({ data, keyvalues });
    return { cid, size: 0, timestamp: new Date().toISOString(), gatewayUrl: null, local: true };
  }

  const result = await p.pinJSONToIPFS(data, {
    pinataMetadata: { name: "bounty-capsule", keyvalues },
  });

  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Timestamp,
    gatewayUrl: getGatewayUrl(result.IpfsHash),
  };
}

/**
 * List pins filtered by keyvalue metadata.
 * Uses pinList() which is the correct @pinata/sdk v2 method.
 */
export async function listFiles(keyvalues = {}) {
  const p = getPinata();
  if (!p) { console.warn("[Pinata] Not configured."); return []; }

  // Build metadata filter — pinList accepts { metadata: { keyvalues: { key: { value, op } } } }
  const kvFilter = Object.fromEntries(
    Object.entries(keyvalues).map(([k, v]) => [k, { value: v, op: "eq" }])
  );

  const result = await p.pinList({
    status: "pinned",
    metadata: Object.keys(kvFilter).length ? { keyvalues: kvFilter } : undefined,
  });

  return (result.rows || []).map((row) => ({
    cid: row.ipfs_pin_hash,
    name: row.metadata?.name,
    keyvalues: row.metadata?.keyvalues,
    size: row.size,
    timestamp: row.date_pinned,
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
  if (!p) { console.warn("[Pinata] Not configured."); return null; }
  return p.pinByHash(cid);
}

export async function unpin(cid) {
  const p = getPinata();
  if (!p) { console.warn("[Pinata] Not configured."); return null; }
  return p.unpin(cid);
}
