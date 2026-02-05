use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::state::VaultState;
#[derive(Accounts)]
pub struct Deposit<'info> {
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

impl<'info> Deposit<'info> {
    pub fn deposit_handler(&mut self, amount: u64) -> Result<()> {
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
