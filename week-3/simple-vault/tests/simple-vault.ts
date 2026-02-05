import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleVault } from "../target/types/simple_vault";
import { expect } from "chai";

const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
const LAMPORTS_PER_SOL = anchor.web3.LAMPORTS_PER_SOL;
describe("simple-vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.simpleVault as Program<SimpleVault>;
  const creator = provider.wallet.publicKey;

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
  console.log("\n" + "=".repeat(50));
  console.log("Creator:", creator.toBase58());
  console.log("vaultStatePda:", vaultStatePda.toBase58());
  console.log("vaultPda:", vaultPda.toBase58());
  console.log("\n" + "=".repeat(50));

  before(async () => {
    // Airdrop for fees
    await provider.connection.requestAirdrop(
      creator,
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

    const vaultBalance = await provider.connection.getBalance(vaultPda);
    const rentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultBalance).to.equal(rentExempt);
  });

  it("Deposit 0.5 SOL into the vault!", async () => {
    const amount = 0.5 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    const tx = await program.methods
      .deposit(new anchor.BN(amount))
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();
    console.log("Deposit transaction signature:", tx);

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    expect(finalVaultBalance).to.equal(initialVaultBalance + amount);
    expect(finalUserBalance).to.equal(initialUserBalance - amount - 5000);
  });

  it("Deposit 1 SOL into the vault!", async () => {
    const amount = 1 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    const tx = await program.methods
      .deposit(new anchor.BN(amount))
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();
    console.log("Deposit transaction signature:", tx);

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    expect(finalVaultBalance).to.equal(initialVaultBalance + amount);
    expect(finalUserBalance).to.equal(initialUserBalance - amount - 5000);
  });
});
