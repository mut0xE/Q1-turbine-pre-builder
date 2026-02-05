use anchor_lang::error_code;
#[error_code]
pub enum VaultError {
    #[msg("The provided signer is not allowed to access this vault")]
    Unauthorized,
    #[msg("The vault does not have enough funds")]
    InsufficientFunds,
}
