use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{constants::VAULT_SEED, state::VaultState};
#[derive(Accounts)]
pub struct CloseAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds=[b"vault_state",signer.key().as_ref()],bump,close=signer
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds=[b"vault",signer.key().as_ref(),vault_state.key().as_ref()],
        bump,)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}
impl<'info> CloseAccounts<'info> {
    pub fn close_handler(&mut self) -> Result<()> {
        let amount = self.vault.try_lamports()?;
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
