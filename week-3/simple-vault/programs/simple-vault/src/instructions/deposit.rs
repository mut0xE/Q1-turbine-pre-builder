use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{VAULT_SEED, VAULT_STATE_SEED},
    error::VaultError,
    state::VaultState,
};
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[VAULT_STATE_SEED,signer.key().as_ref()],bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds=[VAULT_SEED,signer.key().as_ref(),vault_state.key().as_ref()],
        bump)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit_handler(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        let cpi_ctx = CpiContext::new(
            self.system_program.to_account_info(),
            Transfer {
                from: self.signer.to_account_info(),
                to: self.vault.to_account_info(),
            },
        );
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
