//https://gateway.irys.xyz/CdeJzBfxq93jzbwjPSpn2JK48nzGVZ8Ly3j8Hm1tctb5
import wallet from "../turbin3-wallet.json";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    //1. Load image
    //2. Convert image to generic file.
    //3. Upload image
    const image = await readFile("red.jpeg");
    const image_file = createGenericFile(image, "red.jpeg", {
      contentType: "image/jpeg",
    });
    const [imageURI] = await umi.uploader.upload([image_file]);
    console.log("Uploaded image URI: ", imageURI);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
