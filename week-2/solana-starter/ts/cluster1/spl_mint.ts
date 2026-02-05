import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../turbin3-wallet.json";
// Import our keypair from the wallet file
const payer = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("6XsELHq67D19egqzm2PbvmSa3fCQbavTDm65yhejwXtN");
const amount = token_decimals * BigInt(100);
(async () => {
  try {
    // Create an ATA
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
    );
    console.log(`Your ata is: ${ata.address.toBase58()}`);
    // Mint to ATA
    const mintTx = await mintTo(
      connection,
      payer,
      mint,
      ata.address,
      payer.publicKey,
      amount,
    );
    console.log(`Your mint txid: ${mintTx}`);
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
