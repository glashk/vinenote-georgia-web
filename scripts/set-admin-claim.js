#!/usr/bin/env node
/**
 * Set admin custom claim for a Firebase user.
 *
 * Prerequisites:
 * 1. Download service account key from Firebase Console:
 *    Project Settings → Service Accounts → Generate new private key
 * 2. Save as serviceAccountKey.json in project root (add to .gitignore!)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/set-admin-claim.js <uid>
 *
 * Or with explicit path:
 *   node scripts/set-admin-claim.js <uid> --key=./serviceAccountKey.json
 */

const admin = require("firebase-admin");

const args = process.argv.slice(2);
const uidArg = args.find((a) => !a.startsWith("--"));
const keyArg = args.find((a) => a.startsWith("--key="));

if (keyArg) {
  const keyPath = keyArg.replace("--key=", "");
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

if (!uidArg) {
  console.error("Usage: node scripts/set-admin-claim.js <uid> [--key=./serviceAccountKey.json]");
  console.error("\nGet UID from Firebase Console → Authentication → Users");
  process.exit(1);
}

const uid = uidArg;

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Error: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.");
  console.error("Example: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/set-admin-claim.js", uid);
  process.exit(1);
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("✓ Admin claim set for uid:", uid);
    console.log("  User must sign out and sign in again for the claim to take effect.");
  } catch (err) {
    console.error("Error:", err.message);
    if (err.code === "auth/user-not-found") {
      console.error("  User not found. Check the UID in Firebase Console → Authentication → Users");
    }
    process.exit(1);
  }
}

main();
