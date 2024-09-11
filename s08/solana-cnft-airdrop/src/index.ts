import {
  createNftCollection,
  createBubblegumTree,
  mintCnfts,
} from "./createNft";
import { publicKey } from "@metaplex-foundation/umi";

// wallet list to Airdrop cNFTs
const walletAddresses = ["wallet1", "wallet2", "wallet3"].map((address) =>
  publicKey(address),
);

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
