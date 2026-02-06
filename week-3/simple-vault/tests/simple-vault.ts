import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleVault } from "../target/types/simple_vault";
import { expect } from "chai";
const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;
const LAMPORTS_PER_SOL = anchor.web3.LAMPORTS_PER_SOL;

function formatBalance(plaintext: number): string {
  return (plaintext / LAMPORTS_PER_SOL).toFixed(9);
}
function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function logBalances(input: string, vault: number, user: number) {
  console.log(`\n${input}:`);
  console.log(`  Vault: ${formatBalance(vault)} SOL`);
  console.log(`  User:  ${formatBalance(user)} SOL`);
}

function logTransactionResult(input: string, txSignature: string) {
  console.log(`\n ${input}`);
  console.log(`  Tx: ${txSignature}`);
}

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
    logSection("TEST: Initialize Vault");
    const initalvaultBalance = await provider.connection.getBalance(vaultPda);
    console.log(
      `\nBefore: Vault Balance = ${formatBalance(initalvaultBalance)} SOL`
    );

    const tx = await program.methods
      .initializeVault()
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();
    const vaultStateAccount = await program.account.vaultState.fetch(
      vaultStatePda
    );

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    console.log(
      `After:  Vault balance = ${formatBalance(
        finalVaultBalance
      )} SOL (rent-exempt)`
    );
    logTransactionResult("Vault initialized successfully", tx);
    const rentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    expect(vaultStateAccount.vaultBump).to.equal(vaultBump);
    expect(vaultStateAccount.stateBump).to.equal(stateBump);
    expect(vaultStateAccount.creator.toBase58()).to.equal(creator.toBase58());
    expect(finalVaultBalance).to.equal(rentExempt);
  });

  it("Deposit 0.5 SOL into the vault!", async () => {
    logSection("TEST: Deposit 0.5 SOL");

    const amount = 0.5 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    logBalances("Before Deposit", initialVaultBalance, initialUserBalance);

    const tx = await program.methods
      .deposit(new anchor.BN(amount))
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    logBalances("After Deposit", finalVaultBalance, finalUserBalance);
    console.log(
      `\n  Change: Vault +${formatBalance(amount)} SOL, User -${formatBalance(
        amount
      )} SOL (+ fees)`
    );
    logTransactionResult("Deposit successful", tx);

    expect(finalVaultBalance).to.equal(initialVaultBalance + amount);
    expect(finalUserBalance).to.equal(initialUserBalance - amount - 5000);
  });

  it("Deposit 1 SOL into the vault!", async () => {
    logSection("TEST: Deposit 1 SOL");

    const amount = 1 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    logBalances("Before Deposit", initialVaultBalance, initialUserBalance);

    const tx = await program.methods
      .deposit(new anchor.BN(amount))
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    logBalances("After Deposit", finalVaultBalance, finalUserBalance);
    console.log(
      `\n  Change: Vault +${formatBalance(amount)} SOL, User -${formatBalance(
        amount
      )} SOL (+ fees)`
    );
    logTransactionResult("Deposit successful", tx);

    expect(finalVaultBalance).to.equal(initialVaultBalance + amount);
    expect(finalUserBalance).to.equal(initialUserBalance - amount - 5000);
  });

  it("Withdraw 1 SOL into the vault!", async () => {
    logSection("TEST: Withdraw 1 SOL");

    const amount = 1 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);

    logBalances("Before Withdrawal", initialVaultBalance, initialUserBalance);

    const tx = await program.methods
      .withdraw(new anchor.BN(amount))
      .accounts({
        signer: creator,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();

    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    logBalances("After Withdrawal", finalVaultBalance, finalUserBalance);
    console.log(
      `\n  Change: Vault -${formatBalance(amount)} SOL, User +${formatBalance(
        amount
      )} SOL (- fees)`
    );
    logTransactionResult("Withdrawal successful", tx);

    expect(finalVaultBalance).to.equal(initialVaultBalance - amount);
    expect(finalUserBalance).to.equal(initialUserBalance + amount - 5000);
  });

  it("Withdraw 2 SOL from the vault! Should Fail (Insufficient Funds)", async () => {
    logSection("TEST: Withdraw 2 SOL (Should Fail)");

    const amount = 2 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    logBalances(
      "Before Attempted Withdrawal",
      initialVaultBalance,
      initialUserBalance
    );
    console.log(
      `\n  Attempting to withdraw ${formatBalance(
        amount
      )} SOL (vault only has ${formatBalance(initialVaultBalance)})`
    );
    try {
      await program.methods
        .withdraw(new anchor.BN(amount))
        .accounts({
          signer: creator,
          vaultState: vaultStatePda,
          vault: vaultPda,
          systemProgram: SYSTEM_PROGRAM,
        })
        .rpc();
      expect.fail("Withdraw should have failed but succeeded.");
    } catch (err) {
      expect(err.toString()).to.include("InsufficientFunds.");
    }
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    logBalances("After Rejection", finalVaultBalance, finalUserBalance);
    console.log(`\n  Balances unchanged (transaction failed)`);

    expect(finalVaultBalance).to.equal(initialVaultBalance);
    expect(finalUserBalance).to.equal(initialUserBalance);
  });

  it("Deposit 0 SOL into the vault! Should Fail", async () => {
    logSection("TEST: Deposit 0 SOL (Should Fail)");

    const amount = 0 * LAMPORTS_PER_SOL;
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialUserBalance = await provider.connection.getBalance(creator);
    logBalances(
      "Before Attempted Deposit",
      initialVaultBalance,
      initialUserBalance
    );

    try {
      await program.methods
        .deposit(new anchor.BN(amount))
        .accounts({
          signer: creator,
          vaultState: vaultStatePda,
          vault: vaultPda,
          systemProgram: SYSTEM_PROGRAM,
        })
        .rpc();
      expect.fail("Deposit of 0 SOL should have failed but succeeded.");
    } catch (err) {
      expect(err.toString()).to.include("InvalidAmount");
    }
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);
    const finalUserBalance = await provider.connection.getBalance(creator);

    logBalances("After Rejection", finalVaultBalance, finalUserBalance);
    console.log(`\n  Balances unchanged (transaction failed)`);

    expect(finalVaultBalance).to.equal(initialVaultBalance);
    expect(finalUserBalance).to.equal(initialUserBalance);
  });

  it("Close the vault", async () => {
    logSection("TEST: Close Vault");

    const initialVaultBalance = await provider.connection.getBalance(vaultPda);
    const initialVaultStateBalance = await provider.connection.getBalance(
      vaultStatePda
    );
    const initialUserBalance = await provider.connection.getBalance(creator);

    console.log(`\nBefore Closing:`);
    console.log(`  Vault:       ${formatBalance(initialVaultBalance)} SOL`);
    console.log(
      `  Vault State: ${formatBalance(initialVaultStateBalance)} SOL`
    );
    console.log(`  User:        ${formatBalance(initialUserBalance)} SOL`);

    const tx = await program.methods
      .close()
      .accountsStrict({
        signer: creator,
        vault: vaultPda,
        vaultState: vaultStatePda,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc();

    const finalUserBalance = await provider.connection.getBalance(creator);
    const finalVaultBalance = await provider.connection.getBalance(vaultPda);

    // VaultState should be closed (null)
    const vaultStateInfo = await provider.connection.getAccountInfo(
      vaultStatePda
    );

    console.log(`\nAfter Closing:`);
    console.log(
      `  Vault:       ${formatBalance(finalVaultBalance)} SOL (closed)`
    );
    console.log(
      `  Vault State: ${vaultStateInfo === null ? "0 SOL (closed)" : "ERROR"}`
    );
    console.log(`  User:        ${formatBalance(finalUserBalance)} SOL`);
    console.log(
      `\n  Recovered: ${formatBalance(
        initialVaultBalance + initialVaultStateBalance
      )} SOL`
    );
    logTransactionResult("Vault successfully closed", tx);

    // Vault should be 0
    expect(await provider.connection.getBalance(vaultPda)).to.equal(0);
    expect(vaultStateInfo).to.be.null;

    // User gets back the remaining balance - fees
    expect(finalUserBalance).to.equal(
      initialUserBalance + initialVaultBalance + initialVaultStateBalance - 5000
    );
  });
});
