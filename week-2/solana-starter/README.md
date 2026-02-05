# Week 2: Mint and Trade SPL Tokens on Solana Devnet

This section demonstrates how to mint, send, and trade SPL tokens on Solana Devnet.

### **Token Details**

- **Mint Address:** `6XsELHq67D19egqzm2PbvmSa3fCQbavTDm65yhejwXtN`
- **Name:** RED
- **Symbol:** RC
- **Decimals:** 6
- **Network:** Devnet

![Token Overview](./images/token_overview.png)

[View on Solana Explorer](https://orbmarkets.io/token/6XsELHq67D19egqzm2PbvmSa3fCQbavTDm65yhejwXtN?cluster=devnet)

## Completed Tasks

### **Mint Transaction**
![Mint Transaction](./images/token_mint.png)

[View Mint Transaction](https://orbmarkets.io/tx/53p8wQTV5ZAUxmcY7gitfLbXDEDbhXN5Nhxc4iDbDmFChihn4xGL6LTE8C3R49rPATrVuouGptpWY648WV2iym7B?cluster=devnet)

## Token Transfer
### **Transfer Transaction**
![Transfer Transaction](./images/token_transfer.png)

[View Transfer Transaction](https://orbmarkets.io/tx/2afxLPrkJkqiScYBySqc4QVAPK15eTY4uhUVUF7YA96Hbw4eRk1AFhkTh77kLgxfDUXvcGsPcu6JFbnvVRvkcYsN?cluster=devnet)


## Week 3: 3.1 NFTs (Mint and Swap)

This section demonstrates minting a custom NFT on Solana Devnet, uploading metadata to Irys, and swapping the NFT with other users on Devnet.

### **NFT Details**

- **Mint Address:** `ENibpPNbND26jmyoNNeg36uexYNKifmpkwaZSpdXnPRw`
- **Name:** RED
- **Symbol:** RC
- **Network:** Devnet

### **Mint Transaction**
- Minted RED NFT
![NFT Mint](./images/nft_mint.png)

[View Mint Transaction](https://orbmarkets.io/tx/3g2Y1T5bCHAyW9QuNKd9ozGssvG7xfSFjec4sarcvnSYpDPtQtuEpHBp76zL2DvAPnoYF1tnJULadM6Y2bta9AxQ?cluster=devnet&tab=balances)

### **NFT Swap (Trade)**
- Send Transaction:
![NFT Sent](./images/nft_sent.png)

[View Sent Transaction](https://orbmarkets.io/tx/2MUqWC2GMpKaBngDkqKE4LGb67WEyypQd2kG2EZAwV4qXjky87ASLDhmF311qwTMnqqa5TnZCispaoRUEamdopj?cluster=devnet&tab=summary)
- Receive Transaction:
![NFT Received](./images/nft_receive.png)

[View Receive Transaction](https://orbmarkets.io/tx/4bFHBAtY4gp5vWUmqNm3SWPYotjn7tRuV761HRKxYS2nQHuEwocThqKGdAvcJxxKj4XE8uDAn9VzMUwUbUkasbWm?cluster=devnet&tab=summary)

### **Reflection (Problems & Solutions)**
**Problem:**  
- Trading NFTs manually requires trust. You have to trust the other person to send their NFT back after receiving yours.

**Solution:**  
- Using an **On-Chain Escrow Vault Program**.
- With escrow, Both NFTs are deposited into a secure vault program, and the program only completes the swap if both parties have fulfilled their part.  
- This ensures: 
- Either both transfers succeed, or both fail  
- No trust is required  
- No risk of one-sided trades

## Summary
Week 2:
- SPL Token minted successfully on Devnet
- Verified mint address and token details
- Included mint transaction hash
- Performed a token transfer and included its transaction hash

Week 3:
- Successfully minted a custom NFT (RED) on Solana Devnet  
- Uploaded image and metadata to Irys  
- Verified NFT mint address and metadata URI  
- Completed an NFT swap (trade) with other user on Devnet
