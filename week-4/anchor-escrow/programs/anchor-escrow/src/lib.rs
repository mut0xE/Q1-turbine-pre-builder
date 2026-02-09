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

    pub fn make(ctx: Context<MakerAccounts>, seed: u64, receive: u64, deposit: u64) -> Result<()> {
        ctx.accounts
            .make_handler(seed, receive, deposit, &ctx.bumps)?;
        Ok(())
    }

    pub fn take(ctx: Context<TakerAccounts>) -> Result<()> {
        ctx.accounts.taker_handler()?;
        Ok(())
    }

    pub fn refund(ctx: Context<RefundAccounts>) -> Result<()> {
        ctx.accounts.refund_handler()?;
        Ok(())
    }
}
