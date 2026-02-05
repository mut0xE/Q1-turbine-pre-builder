use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{constants::VAULT_SEED, error::VaultError, state::VaultState};
#[derive(Accounts)]
pub struct WithdrawAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"vault_state",signer.key().as_ref()],bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds=[b"vault",signer.key().as_ref(),vault_state.key().as_ref()],
        bump)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}
impl<'info> WithdrawAccounts<'info> {
    pub fn withdraw_handler(&mut self, amount: u64) -> Result<()> {
        require!(
            self.vault.lamports() >= amount,
            VaultError::InsufficientFunds
        );
        require!(
            self.signer.key() == self.vault_state.creator.key(),
            VaultError::Unauthorized
        );
        let signer_seeds: &[&[&[u8]]] = &[&[
            VAULT_SEED,
            self.signer.key.as_ref(),
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ]];
        let cpi_ctx = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            Transfer {
                from: self.vault.to_account_info(),
                to: self.signer.to_account_info(),
            },
            signer_seeds,
        );
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
