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
pub struct TakerAccounts<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
       mut,
       close=maker,
       has_one=mint_a,
       has_one=mint_b,
       has_one=maker,
        seeds=[
            ESCROW_SEED,
            escrow.seed.to_le_bytes().as_ref(),
            maker.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    // Token mint for the asset taker receives (Token A).
    #[account(
        mint::token_program=token_program
    )]
    pub mint_a: InterfaceAccount<'info, Mint>,

    // Token mint for the asset taker provides (Token B).
    #[account(
        mint::token_program=token_program
    )]
    pub mint_b: InterfaceAccount<'info, Mint>,

    // Vault: Associated Token Account owned by Escrow PDA
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    // taker's token account for mint A
    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=mint_a,
        associated_token::authority=taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,

    // Taker's token account holding Token B for payment.
    #[account(
        mut,
        associated_token::mint=mint_b,
        associated_token::authority=taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Maker's token account to receive Token B.
    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=mint_b,
        associated_token::authority=maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> TakerAccounts<'info> {
    pub fn taker_handler(&mut self) -> Result<()> {
        require!(
            self.escrow.status == EscrowStatus::Deposited,
            EscrowError::InvalidStatus
        );
        // 1. Transfer payment tokens from taker to maker
        self.transfer_payment()?;
        // 2. Transfer NFT from vault to taker (requires PDA seeds)
        self.transfer_nft()?;
        // 3. Close vault account and send rent to maker
        self.close_vault()?;
        // 4. Update status
        self.escrow.status = EscrowStatus::Completed;
        Ok(())
    }

    fn transfer_payment(&mut self) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            TransferChecked {
                from: self.taker_ata_b.to_account_info(),
                mint: self.mint_b.to_account_info(),
                to: self.maker_ata_b.to_account_info(),
                authority: self.taker.to_account_info(),
            },
        );
        transfer_checked(cpi_ctx, self.escrow.receive_amount, self.mint_b.decimals)
    }

    fn transfer_nft(&mut self) -> Result<()> {
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
                to: self.taker_ata_a.to_account_info(),
                authority: self.escrow.to_account_info(),
            },
            signer_seeds,
        );
        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals) // NFT has 0 decimals
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
                destination: self.maker.to_account_info(),
                authority: self.escrow.to_account_info(),
            },
            signer_seeds,
        );
        close_account(cpi_ctx)
    }
}
