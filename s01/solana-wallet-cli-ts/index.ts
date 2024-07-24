import { Command } from "commander";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
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
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

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

program.parse(process.argv);
