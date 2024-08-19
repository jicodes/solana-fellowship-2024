import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AssetManagerVault } from "../target/types/asset_manager_vault";

describe("asset_manager_vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .AssetManagerVault as Program<AssetManagerVault>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initializeVault().rpc();
    console.log("Your transaction signature", tx);
  });
});
