
# Solana Summer Fellowship Session 01: exercise

## Description
A simple CLI to interact with a Solana wallet written in TypeScript.
It can create a new keypair, request an airdrop, and send SOL to another public key.

## Usage

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts <command> <options>
```

## Development

Add dependencies
```bash
bun add @solana/web3.js typescript commander @solana-developers/helpers

bun add --dev @types/node dotenv @types/dotenv
```