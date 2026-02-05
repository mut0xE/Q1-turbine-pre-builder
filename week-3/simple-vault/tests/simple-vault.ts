import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleVault } from "../target/types/simple_vault";
import { expect } from "chai";
const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
describe("simple-vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.simpleVault as Program<SimpleVault>;
  const creator = provider.wallet.publicKey;
  const user = anchor.web3.Keypair.generate();

  // Derive PDAs
  const [vaultStatePda, stateBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault_state"), creator.toBuffer()],
      program.programId
    );

  const [vaultPda, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), creator.toBuffer(), vaultStatePda.toBuffer()],
    program.programId
  );
  console.log("\n" + "=".repeat(80));
  console.log("Creator:", creator.toBase58());
  console.log("user:", user.publicKey.toBase58());
  console.log("vaultStatePda:", vaultStatePda.toBase58());
  console.log("vaultPda:", vaultPda.toBase58());
  console.log("\n" + "=".repeat(80));

  before(async () => {
    // Airdrop for fees
    await provider.connection.requestAirdrop(
      creator,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      user.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
  it("Initialize the vault!", async () => {
    const tx = await program.methods
      .initializeVault()
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();
    console.log("Initialize transaction signature:", tx);
    const vaultStateAccount = await program.account.vaultState.fetch(
      vaultStatePda
    );
    expect(vaultStateAccount.vaultBump).to.equal(vaultBump);
    expect(vaultStateAccount.stateBump).to.equal(stateBump);
    expect(vaultStateAccount.creator.toBase58()).to.equal(creator.toBase58());
    const vaultAccount = await provider.connection.getAccountInfo(vaultPda);
    console.log("vault account", vaultAccount);
    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const rentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).to.equal(rentExempt);
  });
});
