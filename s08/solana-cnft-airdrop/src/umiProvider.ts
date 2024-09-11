import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { clusterApiUrl } from "@solana/web3.js";
import { mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import dotenv from "dotenv";
dotenv.config();

const sk = process.env.SECRET_KEY;
if (!sk) {
  throw new Error("No secret key provided");
}

export const umi = createUmi(clusterApiUrl("devnet"))
  .use(mplBubblegum())
  .use(mplTokenMetadata());

// Create a Keypair from the secret key.
let keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(JSON.parse(sk)),
);

// Before Umi can use this Keypair you need to generate
// a Signer type with it.
const signer = createSignerFromKeypair(umi, keypair);

// Tell Umi to use the new signer.
umi.use(signerIdentity(signer));
