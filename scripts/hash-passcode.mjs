#!/usr/bin/env node
// Generates ADMIN_PASSCODE_HASH (scrypt) and a random ADMIN_SESSION_SECRET.
// Usage: npm run admin:hash -- "<passcode>"
import { randomBytes, scryptSync } from "node:crypto";

const passcode = process.argv[2];
if (!passcode || passcode.length < 12) {
  console.error('Usage: npm run admin:hash -- "<passcode of at least 12 characters>"');
  process.exit(1);
}
const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const key = scryptSync(passcode, salt, 32, { N, r, p });
const hash = ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
console.log(`ADMIN_PASSCODE_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
console.log("\nIn .env files, wrap the hash in single quotes so '$' is not expanded.");
