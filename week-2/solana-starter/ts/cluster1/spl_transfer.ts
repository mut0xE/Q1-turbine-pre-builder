import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import wallet from "../turbin3-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const source = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("6XsELHq67D19egqzm2PbvmSa3fCQbavTDm65yhejwXtN");

// Recipient address
const to = new PublicKey("8YcGdrP6b5K3WufCfEZnDRiMEhFAjPim7nLr6VimguY4");
(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const sourceAta = await getOrCreateAssociatedTokenAccount(
      connection,
      source,
      mint,
      source.publicKey,
    );
    console.log("Source ATA Address:", sourceAta.address.toBase58());
    // Get the token account of the toWallet address, and if it does not exist, create it
    const destinationAta = await getOrCreateAssociatedTokenAccount(
      connection,
      source,
      mint,
      to,
    );
    console.log("Destination ATA Address:", destinationAta.address.toBase58());
    // Transfer the new token to the "toTokenAccount" we just created
    const tx = await transfer(
      connection,
      source,
      sourceAta.address,
      destinationAta.address,
      source,
      10_000_000,
    );
    console.log("Your transfer tx:", tx);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
