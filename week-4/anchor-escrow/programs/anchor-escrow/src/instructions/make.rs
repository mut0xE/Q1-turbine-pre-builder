use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants::ESCROW_SEED,
    error::EscrowError,
    state::{Escrow, EscrowStatus},
};

#[derive(Accounts)]
#[instruction(seed:u64)]
pub struct MakerAccounts<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        init,
        payer=maker,
        space= Escrow::DISCRIMINATOR.len() + Escrow::LEN,
        seeds=[
            ESCROW_SEED,
            seed.to_le_bytes().as_ref(),
            maker.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mint::token_program=token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,

    #[account(mint::token_program=token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,

    // Vault: Associated Token Account owned by Escrow PDA
    #[account(
        init,
        payer=maker,
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
impl<'info> MakerAccounts<'info> {
    pub fn initialize_escrow_handler(
        &mut self,
        seed: u64,
        receive: u64,
        bump: &MakerAccountsBumps,
    ) -> Result<()> {
        self.escrow.set_inner(Escrow {
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            receive_amount: receive,
            status: EscrowStatus::Initialized,
            seed,
            bump: bump.escrow,
        });
        Ok(())
    }
    pub fn deposit_handler(&mut self, deposit_amount: u64) -> Result<()> {
        require!(
            self.escrow.status == EscrowStatus::Initialized,
            EscrowError::InvalidStatus
        );
        require!(deposit_amount > 0, EscrowError::InvalidAmount);
        // Transfer the A from the maker to the vault
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            TransferChecked {
                from: self.maker_ata_a.to_account_info(),
                mint: self.mint_a.to_account_info(),
                to: self.vault.to_account_info(),
                authority: self.maker.to_account_info(),
            },
        );

        transfer_checked(cpi_ctx, deposit_amount, self.mint_a.decimals)?;

        // Update the escrow status
        self.escrow.status = EscrowStatus::Deposited;
        Ok(())
    }
}
