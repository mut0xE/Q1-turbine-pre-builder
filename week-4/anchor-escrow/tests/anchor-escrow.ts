import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import { BN } from "bn.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";
const SYSTEM_PROGRAM = anchor.web3.SystemProgram.programId;

describe("anchor-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const program = anchor.workspace.anchorEscrow as Program<AnchorEscrow>;
  const PROGRAM_ID = program.programId;

  const seed = new BN(Math.floor(Math.random() * 1000));

  const maker = provider.wallet.publicKey;
  const taker = anchor.web3.Keypair.generate();
  let nftMint: anchor.web3.PublicKey;
  let paymentMint: anchor.web3.PublicKey;
  let makerAtaNft: anchor.web3.PublicKey;
  let takerAtaPayment: anchor.web3.PublicKey;
  let makerAtaPayment: anchor.web3.PublicKey;
  let takerAtaNft: anchor.web3.PublicKey;

  let escrowPda: anchor.web3.PublicKey;
  let escrowBump: number;
  let vault: anchor.web3.PublicKey;

  const receiveAmount = 100;
  const depositAmount = 1;

  const logTransactionResult = (label: string, txSignature: string) => {
    console.log(`\n${label}:`);
    console.log(`Txn signature: ${txSignature}`);
  };

  before(async () => {
    // Airdrop SOL to maker and taker
    await provider.connection.requestAirdrop(
      maker,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      taker.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create NFT mint
    nftMint = await createMint(
      provider.connection,
      provider.wallet.payer, // payer
      maker, // mint authority
      null, // freeze authority
      0 // decimals
    );

    paymentMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      taker.publicKey,
      null,
      6
    );

    // Create the maker's NFT ATA and mint 1 NFT
    makerAtaNft = getAssociatedTokenAddressSync(nftMint, maker);

    const makerAtaNftTx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        makerAtaNft,
        maker,
        nftMint
      )
    );
    await provider.sendAndConfirm(makerAtaNftTx);

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      nftMint,
      makerAtaNft,
      provider.wallet.payer,
      1
    );

    takerAtaPayment = getAssociatedTokenAddressSync(
      paymentMint,
      taker.publicKey
    );
    const takerAtaBTx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        taker.publicKey,
        takerAtaPayment,
        taker.publicKey,
        paymentMint
      )
    );
    await provider.sendAndConfirm(takerAtaBTx, [taker]);

    await mintTo(
      provider.connection,
      taker,
      paymentMint,
      takerAtaPayment,
      taker,
      1000 * 1e6
    );

    takerAtaNft = getAssociatedTokenAddressSync(nftMint, taker.publicKey);
    makerAtaPayment = getAssociatedTokenAddressSync(paymentMint, maker);

    // Compute the escrow PDA
    [escrowPda, escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), seed.toBuffer("le", 8), maker.toBuffer()],
      PROGRAM_ID
    );
    // Compute the vault ATA (for the NFT mint, owned by the escrow PDA)
    vault = getAssociatedTokenAddressSync(nftMint, escrowPda, true);
  });

  it("Initializing Escrow, Vault and Deposit", async () => {
    const tx = await program.methods
      .make(seed, new BN(receiveAmount * 1e6), new BN(depositAmount))
      .accounts({
        maker,
        escrow: escrowPda,
        mintA: nftMint,
        mintB: paymentMint,
        vault,
        makerAtaA: makerAtaNft,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc({ commitment: "confirmed" });
    logTransactionResult("Initializing Escrow, Vault and Deposit", tx);

    const escrowAccount = await program.account.escrow.fetch(escrowPda);

    expect(escrowAccount.maker.toBase58()).to.equal(maker.toBase58());
    expect(escrowAccount.mintA.toBase58()).to.equal(nftMint.toBase58());
    expect(escrowAccount.mintB.toBase58()).to.equal(paymentMint.toBase58());
    expect(escrowAccount.receiveAmount.toNumber()).to.equal(
      receiveAmount * 1e6
    );
    expect(escrowAccount.bump).to.equal(escrowBump);

    const vaultBalance = (
      await provider.connection.getTokenAccountBalance(vault)
    ).value.uiAmount;
    expect(vaultBalance).to.equal(depositAmount);
  });

  it("Taker accepts escrow and completes swap", async () => {
    const tx = await program.methods
      .take()
      .accounts({
        taker: taker.publicKey,
        maker,
        escrow: escrowPda,
        mintA: nftMint,
        mintB: paymentMint,
        vault,
        takerAtaA: takerAtaNft,
        takerAtaB: takerAtaPayment,
        makerAtaB: makerAtaPayment,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM,
      })
      .signers([taker])
      .rpc({ commitment: "confirmed" });
    logTransactionResult("Take escrow Completed", tx);

    const escrowInfo = await provider.connection.getAccountInfo(escrowPda);
    expect(escrowInfo).to.be.null;

    const vaultInfo = await provider.connection.getAccountInfo(vault);
    expect(vaultInfo).to.be.null;

    //taker receive account
    const takerNftAccount = (
      await provider.connection.getTokenAccountBalance(takerAtaNft)
    ).value.uiAmount;
    expect(takerNftAccount).to.equal(depositAmount);

    //maker payment account
    const makerPaymentAccount = (
      await provider.connection.getTokenAccountBalance(makerAtaPayment)
    ).value.uiAmount;
    expect(makerPaymentAccount).to.equal(receiveAmount);
  });

  it("Initializing Escrow, Vault, Deposit and Refund", async () => {
    const seed = new BN(Math.floor(Math.random() * 1000));
    [escrowPda, escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), seed.toBuffer("le", 8), maker.toBuffer()],
      PROGRAM_ID
    );
    vault = getAssociatedTokenAddressSync(nftMint, escrowPda, true);
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      nftMint,
      makerAtaNft,
      provider.wallet.payer,
      1
    );
    await program.methods
      .make(seed, new BN(receiveAmount * 1e6), new BN(depositAmount))
      .accounts({
        maker,
        escrow: escrowPda,
        mintA: nftMint,
        mintB: paymentMint,
        vault,
        makerAtaA: makerAtaNft,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc({ commitment: "confirmed" });

    const tx_refund = await program.methods
      .refund()
      .accounts({
        maker,
        escrow: escrowPda,
        mintA: nftMint,
        vault,
        makerAtaA: makerAtaNft,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM,
      })
      .rpc({ commitment: "confirmed" });
    logTransactionResult("Refund", tx_refund);

    const escrowInfo = await provider.connection.getAccountInfo(escrowPda);
    expect(escrowInfo).to.be.null;

    const vaultBalance = await provider.connection.getAccountInfo(vault);
    expect(vaultBalance).to.be.null;
  });
});
