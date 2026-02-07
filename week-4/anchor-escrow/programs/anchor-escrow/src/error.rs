use anchor_lang::prelude::error_code;
#[error_code]
pub enum EscrowError {
    #[msg("Invalid payment mint decimals")]
    InvalidPaymentMint,

    #[msg("Insufficient escrow balance")]
    InsufficientBalance,

    #[msg("Unauthorized action - signer mismatch")]
    Unauthorized,

    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,

    #[msg("Payment amount mismatch")]
    PaymentAmountMismatch,
}
