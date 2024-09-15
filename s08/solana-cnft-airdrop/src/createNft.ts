import { umi } from "./umiProvider";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";

import {
  createTree,
  fetchMerkleTree,
  LeafSchema,
  mintToCollectionV1,
  parseLeafFromMintToCollectionV1Transaction,
} from "@metaplex-foundation/mpl-bubblegum";

import { PublicKey, TransactionBuilder } from "@metaplex-foundation/umi";

// Create a new NFT collection
export async function createNftCollection(): Promise<PublicKey> {
  const collectionMint = generateSigner(umi);

  console.log("Creating collection...");
  await createNft(umi, {
    mint: collectionMint,
    name: "Solana Fellow cNFT collection",
    symbol: "FELLOW",
    uri: "https://lime-wily-harrier-571.mypinata.cloud/ipfs/QmeQYaSLfKrN1JNp3ANNovsDcYZYrxAoqFSweQUMds9hLj",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  }).sendAndConfirm(umi);

  console.log("Collection created:", collectionMint.publicKey);
  return collectionMint.publicKey;
}

// Creating Bubblegum Trees
export async function createBubblegumTree(): Promise<PublicKey> {
  const merkleTree = generateSigner(umi);

  console.log("Creating merkle tree...");
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });
  await builder.sendAndConfirm(umi);

  const tree = await fetchMerkleTree(umi, merkleTree.publicKey);
  console.log("Merkle tree created:", tree);

  return merkleTree.publicKey;
}

// mintCnft : TransactionBuilder
function mintCnft(
  leafOwner: PublicKey,
  merkleTree: PublicKey,
  collectionMint: PublicKey,
): TransactionBuilder {
  console.log("Preparing cNFT mint for:", leafOwner);
  return mintToCollectionV1(umi, {
    leafOwner,
    merkleTree,
    collectionMint,
    metadata: {
      name: "Solana Fellow cNFT",
      symbol: "FELLOW",
      uri: "https://lime-wily-harrier-571.mypinata.cloud/ipfs/QmRdXXainRqRJQtDn5ZDFDXY3yeU14TKq5hV5A83J12yHb",
      sellerFeeBasisPoints: 0,
      collection: { key: collectionMint, verified: false },
      creators: [
        { address: umi.identity.publicKey, verified: false, share: 100 },
      ],
    },
  });
}

// mint multiple cNFTs to the collection in parallel

// update: rate limit of helius network is 10 tx/s for free tier,
// parallel minting is not recommended
export async function mintCnfts(
  leafOwners: PublicKey[],
  merkleTree: PublicKey,
  collectionMint: PublicKey,
) {
  console.log(`Minting ${leafOwners.length} cNFTs in parallel...`);

  const mintPromises = leafOwners.map(async (recipient) => {
    const tx = mintCnft(recipient, merkleTree, collectionMint);

    console.log(`Minting cNFT for ${recipient}...`);
    const { signature } = await tx.sendAndConfirm(umi);

    const leaf = await parseLeafFromMintToCollectionV1Transaction(
      umi,
      signature,
    );
    console.log(`Asset ID for ${recipient}: ${leaf.id}`);
    return { recipient, assetId: leaf.id };
  });

  try {
    const results = await Promise.all(mintPromises);
    console.log(`${results.length} cNFTs minted successfully`);
    return results;
  } catch (error) {
    console.error("Error minting cNFTs:", error);
    throw error;
  }
}

// mint multiple cNFTs in sequence
export async function mintCnftsSequentially(
  leafOwners: PublicKey[],
  merkleTree: PublicKey,
  collectionMint: PublicKey,
) {
  console.log(`Minting ${leafOwners.length} cNFTs sequentially...`);

  const results: { recipient: PublicKey; assetId: PublicKey }[] = [];
  for (const recipient of leafOwners) {
    const tx = mintCnft(recipient, merkleTree, collectionMint);

    console.log(`Minting cNFT for ${recipient}...`);
    const { signature } = await tx.sendAndConfirm(umi);

    const leaf: LeafSchema = await parseLeafFromMintToCollectionV1Transaction(
      umi,
      signature,
    );
    console.log(`Asset ID for ${recipient}: ${leaf.id}`);
    results.push({ recipient, assetId: leaf.id });
  }

  console.log(`${results.length} cNFTs minted successfully`);
  return results;
}
