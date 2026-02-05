use anchor_lang::prelude::*;

declare_id!("CmKVpLqQ7C5kGpWuQ6EiivXsEprdgfhk96rDtj4daavr");
mod error;
mod instructions;
mod state;
use instructions::*;
#[program]
pub mod simple_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeAccounts>) -> Result<()> {
        ctx.accounts.initialize_handler(&ctx.bumps)?;
        Ok(())
    }
}
