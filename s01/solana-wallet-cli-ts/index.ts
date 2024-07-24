import { Command } from "commander";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import "dotenv/config";

const rpcUrl = process.env.DEVNET_RPC_URL;
if (typeof rpcUrl !== "string") {
  throw new Error("DEVNET_RPC_URL environment variable is not set.");
}
const connection = new Connection(rpcUrl, "confirmed");

const program = new Command();

program.version("1.0.0").description("Solana Wallet CLI Tool");

program
  .command("keygen")
  .description("Generate a new Solana keypair")
  .action(() => {
    const keypair = Keypair.generate();

    const publicKey = keypair.publicKey.toBase58();
    const secretKey = JSON.stringify(Array.from(keypair.secretKey));

    console.log("New keypair generated:");
    console.log(`Public Key: ${publicKey}`);
    console.log(`Secret Key: ${secretKey}`);
    console.log("Please save these keys securely.");
  });

program
  .command("airdrop <amount> <pubKey>")
  .description("Request an airdrop of SOL tokens to the given address")
  .action(async (amount: string, address: string) => {
    try {
      const publicKey = new PublicKey(address);
      const amountSol = parseFloat(amount);
      const amountLamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      console.log(`Requesting airdrop of ${amount} SOL to ${address}...`);

      const signature = await connection.requestAirdrop(
        publicKey,
        amountLamports,
      );

      console.log("Airdrop requested. Awaiting confirmation...");

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });

      console.log(`Airdrop of ${amount} SOL to ${address} successful!`);
      console.log(`Transaction signature: ${signature}`);

      const balance = await connection.getBalance(publicKey);
      console.log(`New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.error("Error during airdrop:", (error as Error).message);
    }
  });

program
  .command("send <amount> <from> <to>")
  .action(async (amount: string, fromKey: string, to: string) => {
    try {
      const connection = new Connection(rpcUrl, "confirmed");
      const fromKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fromKey)),
      );
      const toPubkey = new PublicKey(to);
      const amountSol = parseFloat(amount);
      const amountLamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      console.log(
        `Sending ${amount} SOL from ${fromKeypair.publicKey.toBase58()} to ${to}...`,
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPubkey,
          lamports: amountLamports,
        }),
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
      );

      console.log(`Transaction successful!`);
      console.log(`Transaction signature: ${signature}`);

      const toBalance = await connection.getBalance(toPubkey);
      console.log(`New balance for ${to}: ${toBalance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.error("Error during send:", (error as Error).message);
    }
  });

program.parse(process.argv);
