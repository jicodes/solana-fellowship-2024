import {
  createNftCollection,
  createBubblegumTree,
  mintCnfts,
} from "./createNft";
import { publicKey, PublicKey } from "@metaplex-foundation/umi";

import * as fs from "fs";
import path from "path";

function readWalletAddresses(filePath: string): PublicKey[] {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Split the content into lines and parse each line as a Solana public key
    const publicKeys = fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0) // Remove empty lines
      .map((line) => {
        try {
          return publicKey(line);
        } catch (error) {
          console.error(`Invalid public key: ${line}`);
          return null;
        }
      })
      .filter((key): key is PublicKey => key !== null);

    return publicKeys;
  } catch (error) {
    console.error("Error reading file:", error);
    return [];
  }
}

const filePath = path.resolve(__dirname, "../assets/wallets.txt");
const walletAddresses = readWalletAddresses(filePath);

if (walletAddresses.length === 0) {
  console.error("No wallet addresses found in the file:", filePath);
  process.exit(1);
}

async function main() {
  const collectionMint = await createNftCollection();
  const merkleTree = await createBubblegumTree();

  const mintResults = await mintCnfts(
    walletAddresses,
    merkleTree,
    collectionMint,
  );
  console.log("Minting results:", mintResults);
}

main().catch(console.error);
