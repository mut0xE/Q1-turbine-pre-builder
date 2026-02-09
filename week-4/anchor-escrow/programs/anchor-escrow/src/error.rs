use anchor_lang::prelude::error_code;
#[error_code]
pub enum EscrowError {
    #[msg("Invalid Amount")]
    InvalidAmount,

    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,
}
