# Solana cNFT Airdrop App

This application demonstrates how to create and airdrop compressed NFTs (cNFTs) on the Solana blockchain using the Metaplex Bubblegum library.

## Features

- Create an NFT collection
- Generate a Merkle tree for compressed NFTs
- Mint and airdrop cNFTs to multiple wallet addresses

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Solana CLI tools
- A Solana wallet with some SOL for transaction fees (on devnet)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd s08/solana-cnft-airdrop
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root and add your Solana wallet's secret key:
   ```
   SECRET_KEY=["your", "secret", "key", "array"]
   ```

## Usage

1. Modify the `walletAddresses` array in `src/index.ts` with the recipient wallet addresses for the airdrop.

2. Run the application:
   ```
   npm start
   ```

The app will perform the following steps:
1. Create a new NFT collection
2. Create a Merkle tree for compressed NFTs
3. Mint and airdrop cNFTs to the specified wallet addresses

## Code Structure

- `src/createNft.ts`: Contains functions for creating the NFT collection, Merkle tree, and minting cNFTs
- `src/umiProvider.ts`: Sets up the Umi instance with necessary plugins and signer
- `src/index.ts`: Main entry point that orchestrates the airdrop process

## Important Notes

- This app is configured to use Solana's devnet. For mainnet deployment, update the cluster in `umiProvider.ts`.
- Ensure you have sufficient SOL in your wallet for transaction fees.
- The Merkle tree is configured with a max depth of `7` and max buffer size of `16`. Adjust these parameters in `createBubblegumTree()` if needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
