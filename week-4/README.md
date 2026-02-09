# Escrow Program (Anchor)

A simple on-chain **Escrow Program** built with the **Anchor**.  
This program enables trustless swaps between two parties (maker and taker) using Program Derived Addresses (PDAs).

## Overview

This escrow program allows two users to swap assets:

- The **maker** creates an escrow and deposit (Token A)
- The **taker** accepts the trade by paying tokens (Token B)
- The program atomically swaps assets
- The maker can refund if the trade is not completed

## Escrow steps

1. Maker initializes escrow  
2. Maker deposits Token A into escrow vault  
3. Taker accepts the trade and pays tokens  
4. Assets are swapped atomically  
5. Escrow is closed 


## Architecture

The Escrow program uses **Program Derived Addresses (PDAs)** to manage vault securely.  

## 1. Escrow PDA

- Stores escrow state and configuration
- Acts as the authority for the vault token account
- Seed: `["escrow", seed, maker_pubkey]`

### 2. Vault (Associated Token Account)

- Holds Token A during the escrow  
- Associated Token Account owned by the Escrow PDA  

## Instructions

## 1. Initialize & Deposit (Maker)

**Purpose:** Creates a new escrow and deposits the Token A.

**Parameters:**
- `seed: u64`
- `receive: u64` 
- `deposit: u64`

- Creates `Escrow` PDA
- Creates `vault` PDA for Token A (owned by escrow PDA)
- Transfers Token A from maker to the vault
- Sets escrow status to `Deposited`  

## 2. Take Escrow (Taker)

**Purpose:** Completes the trade by paying the maker.

- Taker transfers Token B to the maker  
- Token A is transferred from the vault to the taker
- Vault account is closed
- Escrow status set to `Completed`  

## 3. Refund Escrow (Maker)

**Purpose:** Allows the maker to cancel the trade if it is not completed.

- Token A is returned from vault to maker
- Vault account is closed
- Vault account is closed
- Escrow status set to `Refunded`  

## Error Handling

The program includes custom error checks

- InvalidAmount  
  Amount provided is zero or invalid

- InvalidStatus  
  Escrow is in an incorrect state for the operation

## Testing

![ESCROW TEST](./images/escrow_test.png)

### Devnet Information

- **Program ID:** `Tw1wVuYavjQm3zET6wCZh7W6kUHnBMnvGzy7e7NpiKZ`
- **Network:** Devnet

## Example Transactions (Devnet)

### Initialize Escrow & Deposit

[View Initialize Transaction](https://orbmarkets.io/tx/4AYL5dENGBnvhw5hDRokNkDuhYVh4n1uwNoniuubGauQ7EGSzTijvAS99tCAJZsNj4cDQwfR7YJNN8cqx1gbqJcw?cluster=devnet
)

### Take escrow 

[View Deposit Transaction](https://orbmarkets.io/tx/2DuTo1QG7So7DdvVdidkhcuTco8iYN6fNRPbe7LXXPG1NT5Lnqg7q5QTTCiJGq9VREsE37jvQddmpanyX99iGkTm?cluster=devnet
)

### Refund

[View Withdraw Transaction](https://orbmarkets.io/tx/4L8vT1XYJWYHnRH8iSDVXhSCVetQp5upir6AU1G5qPwofZ9qkXpTRzB4CPkocoW7hpzCTCJJizpdP4ijgaMXzkNj?cluster=devnet
)

### Close Vault

[View Close Transaction](https://orbmarkets.io/tx/1YjK6T4aawM9bXx1DLt67VaUndAaEaj9i2sQsdX6NnvwqDcEkRzmXkwBViwz98WXdRj6HcEJQRUTjybf3KM3vnN?cluster=devnet)

## Summary

- Built a escrow program using Anchor  
- Implemented initialize, deposit, take, and refund 
- Tested success and failure cases  
- Deployed and verified on Solana Devnet
