use anchor_lang::prelude::*;

declare_id!("Tw1wVuYavjQm3zET6wCZh7W6kUHnBMnvGzy7e7NpiKZ");
mod constants;
mod error;
mod instructions;
mod state;
use crate::instructions::*;

#[program]
pub mod anchor_escrow {

    use super::*;

    pub fn make(ctx: Context<MakerAccounts>, seed: u64, receive: u64) -> Result<()> {
        ctx.accounts
            .initialize_escrow_handler(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit_handler()?;
        Ok(())
    }
}
