use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub maker: Pubkey,
    pub nft_mint: Pubkey,
    pub payment_mint: Pubkey,
    pub receive_amount: u64,
    pub seed: u64,
    pub bump: u8,
    pub status: EscrowStatus,
}
impl Escrow {
    pub const LEN: usize = 32 + 32 + 32 + 6 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Initialized = 0,  // Escrow created, waiting for NFT deposit
    DepositedNft = 1, // NFT in vault, waiting for taker
    Completed = 2,    // Trade completed successfully
    Refunded = 3,     // Maker refunded, trade cancelled
}
