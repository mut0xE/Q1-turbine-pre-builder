import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../turbin3-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "RED",
    uri: "https://gateway.irys.xyz/HSraSrAY2yFAAuqvDZfT3559rg58PDcvRa4XmaK9Hphr",
    sellerFeeBasisPoints: percentAmount(10),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:\nhttps://orbmarkets.io/tx/${signature}?cluster=devnet`,
  );
  // https://orbmarkets.io/tx/3g2Y1T5bCHAyW9QuNKd9ozGssvG7xfSFjec4sarcvnSYpDPtQtuEpHBp76zL2DvAPnoYF1tnJULadM6Y2bta9AxQ?cluster=devnet
  console.log("Mint Address: ", mint.publicKey);
})();
