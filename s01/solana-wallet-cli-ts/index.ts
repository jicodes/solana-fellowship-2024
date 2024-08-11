import {
  Keypair,
  PublicKey,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { getExplorerLink } from "@solana-developers/helpers";

import "dotenv/config";
import * as fs from "fs";
import { Command } from "commander";

// Configurable Solana network endpoint
const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");

class SolanaWallet {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  generateKeypair(): Keypair {
    const keypair = Keypair.generate();
    return keypair;
  }

  saveKeypair(filepath: string, keypair: Keypair): void {
    const secretKey = JSON.stringify(Array.from(keypair.secretKey));
    fs.writeFileSync(filepath, secretKey);
  }

  async requestAirdrop(
    recipient: PublicKey,
    amountSol: number,
  ): Promise<string> {
    const amountLamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    console.log(
      `Requesting airdrop of ${amountSol} SOL to ${recipient.toBase58()}...`,
    );

    const signature = await this.connection.requestAirdrop(
      recipient,
      amountLamports,
    );

    console.log("Airdrop requested. Awaiting confirmation...");

    const latestBlockHash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });

    console.log(
      `Airdrop of ${amountSol} SOL to ${recipient.toBase58()} successful!`,
    );

    return signature;
  }

  async sendTransaction(
    fromKeypair: Keypair,
    toPubkey: PublicKey,
    amountSol: number,
  ): Promise<string> {
    const amountLamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    console.log(
      `Sending ${amountSol} SOL from ${fromKeypair.publicKey.toBase58()} to ${toPubkey.toBase58()}...`,
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPubkey,
        lamports: amountLamports,
      }),
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [fromKeypair],
    );

    console.log(`Transaction successful!`);

    return signature;
  }

  async getBalance(pubkey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }
}

const program = new Command();

program.version("1.0.0").description("Solana Wallet CLI Tool");

program
  .command("keygen")
  .description("Generate a new Solana keypair")
  .action(() => {
    const wallet = new SolanaWallet();
    const keypair = wallet.generateKeypair();

    const publicKey = keypair.publicKey.toBase58();
    const secretKey = JSON.stringify(Array.from(keypair.secretKey));

    console.log("New keypair generated:");
    console.log(`Public Key: ${publicKey}`);
    console.log(`Secret Key: ${secretKey}`);
    console.log("Please save these keys securely.");

    const filepath = `./${publicKey}.json`;
    wallet.saveKeypair(filepath, keypair);
    console.log(`Keypair saved to ${filepath}`);
  });

program
  .command("airdrop <amount> <recipient_address>")
  .description("Request an airdrop of SOL tokens to the given address")
  .action(async (amount: string, address: string) => {
    try {
      const wallet = new SolanaWallet();
      const recipient = new PublicKey(address);
      const amountSol = parseFloat(amount);

      const signature = await wallet.requestAirdrop(recipient, amountSol);
      const explorerLink = getExplorerLink("tx", signature, "devnet");
      console.log(`View the tx at solana explorer: ${explorerLink}`);

      const balance = await wallet.getBalance(recipient);
      console.log(`New balance for ${recipient} is: ${balance} SOL`);
    } catch (error) {
      console.error("Error during airdrop:", (error as Error).message);
    }
  });

program
  .command("send <amount> <from> <to>")
  .description("Send SOL tokens from one address to another")
  .action(async (amount: string, fromKey: string, to: string) => {
    try {
      const wallet = new SolanaWallet();
      const fromKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fromKey)),
      );
      const toPubkey = new PublicKey(to);
      const amountSol = parseFloat(amount);

      const signature = await wallet.sendTransaction(
        fromKeypair,
        toPubkey,
        amountSol,
      );
      const explorerLink = getExplorerLink("tx", signature, "devnet");
      console.log(`View the tx at solana explorer: ${explorerLink}`);

      const toBalance = await wallet.getBalance(toPubkey);
      console.log(`New balance for ${toPubkey.toBase58()}: ${toBalance} SOL`);
    } catch (error) {
      console.error("Error during send:", (error as Error).message);
    }
  });

program.parse(process.argv);
