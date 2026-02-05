use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::{VAULT_SEED, VAULT_STATE_SEED},
    state::VaultState,
};
#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        space=VaultState::DISCRIMINATOR.len()+VaultState::INIT_SPACE,
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

impl<'info> InitializeAccounts<'info> {
    pub fn initialize_handler(&mut self, bump: &InitializeAccountsBumps) -> Result<()> {
        let rent_exempt = Rent::get()?.minimum_balance(self.vault.data_len());

        let cpi_ctx = CpiContext::new(
            self.system_program.to_account_info(),
            Transfer {
                from: self.signer.to_account_info(),
                to: self.vault.to_account_info(),
            },
        );
        transfer(cpi_ctx, rent_exempt)?;

        self.vault_state.set_inner(VaultState {
            creator: self.signer.key(),
            state_bump: bump.vault_state,
            vault_bump: bump.vault,
        });
        Ok(())
    }
}
