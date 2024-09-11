import { umi } from "./umiProvider";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";

import {
  createTree,
  fetchMerkleTree,
  mintToCollectionV1,
  parseLeafFromMintToCollectionV1Transaction,
  LeafSchema,
} from "@metaplex-foundation/mpl-bubblegum";

import { PublicKey, TransactionBuilder } from "@metaplex-foundation/umi";

// Create a new NFT collection
export async function createNftCollection(): Promise<PublicKey> {
  const collectionMint = generateSigner(umi);

  console.log("Creating collection...");
  await createNft(umi, {
    mint: collectionMint,
    name: "My cNFT Collection",
    symbol: "cNFT",
    uri: "https://lime-wily-harrier-571.mypinata.cloud/ipfs/QmZGmZhPxqTwPyP83aR97zLFUfzheBtYfEjxvH5JWarCBb",
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
    maxDepth: 7,
    maxBufferSize: 16,
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
      name: "My cNFT",
      symbol: "cNFT",
      uri: "https://lime-wily-harrier-571.mypinata.cloud/ipfs/QmSvX5fPFJsCmHJGxeWGRggiajoUMASe81cXHtd6Lq9khH",
      sellerFeeBasisPoints: 0,
      collection: { key: collectionMint, verified: false },
      creators: [
        { address: umi.identity.publicKey, verified: false, share: 100 },
      ],
    },
  });
}

// mint multiple cNFTs in parallel
export async function mintCnfts(
  leafOwners: PublicKey[],
  merkleTree: PublicKey,
  collectionMint: PublicKey,
) {
  console.log(`Minting ${leafOwners.length} cNFTs...`);

  for (let i = 0; i < leafOwners.length; i++) {
    const recipient = leafOwners[i];
    const tx = mintCnft(recipient, merkleTree, collectionMint);

    console.log(`Minting cNFT for ${recipient}...`);
    const { signature } = await tx.sendAndConfirm(umi);

    const leaf = await parseLeafFromMintToCollectionV1Transaction(
      umi,
      signature,
    );
    console.log(`Asset ID for ${recipient}: ${leaf.id}`);
  }

  console.log(`${leafOwners.length} cNFTs minted successfully`);
}
