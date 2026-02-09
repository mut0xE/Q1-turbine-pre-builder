use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{
    constants::ESCROW_SEED,
    error::EscrowError,
    state::{Escrow, EscrowStatus},
};

#[derive(Accounts)]
pub struct RefundAccounts<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mut,
        seeds=[
            ESCROW_SEED,
            escrow.seed.to_le_bytes().as_ref(),
            maker.key().as_ref()],
        bump,
        has_one=mint_a,
        has_one=maker,
        close=maker
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mint::token_program=token_program
    )]
    pub mint_a: InterfaceAccount<'info, Mint>,

    // Vault: Associated Token Account owned by Escrow PDA
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    // Maker's token account for mint A
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> RefundAccounts<'info> {
    pub fn refund_handler(&mut self) -> Result<()> {
        self.refund()?;
        self.close_vault()?;
        self.escrow.status = EscrowStatus::Refunded;
        Ok(())
    }

    // transfer token A from vault to maker Token A ATA
    fn refund(&self) -> Result<()> {
        require!(
            self.escrow.status == EscrowStatus::Deposited,
            EscrowError::InvalidStatus
        );
        let signer_seeds: &[&[&[u8]]] = &[&[
            ESCROW_SEED,
            &self.escrow.seed.to_le_bytes(),
            self.maker.key.as_ref(),
            &[self.escrow.bump],
        ]];
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            TransferChecked {
                from: self.vault.to_account_info(),
                mint: self.mint_a.to_account_info(),
                to: self.maker_ata_a.to_account_info(),
                authority: self.escrow.to_account_info(),
            },
            signer_seeds,
        );
        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;
        Ok(())
    }

    fn close_vault(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            ESCROW_SEED,
            &self.escrow.seed.to_le_bytes(),
            self.maker.key.as_ref(),
            &[self.escrow.bump],
        ]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.vault.to_account_info(),
                destination: self.maker_ata_a.to_account_info(),
                authority: self.escrow.to_account_info(),
            },
            signer_seeds,
        );
        close_account(cpi_ctx)?;
        Ok(())
    }
}
