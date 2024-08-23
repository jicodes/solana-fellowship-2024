use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

declare_id!("X3zrnQrdPsK6nhKcWC5cTZFUXhTzHy5QqqB9xFSC46o");

#[program]
pub mod asset_manager_vault {
    use super::*;

    /// Initializes a new vault for managing user deposits.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.manager = ctx.accounts.manager.key();
        vault.token_mint = ctx.accounts.mint.key();
        vault.total_deposits = 0;
        vault.user_deposits = Vec::new();
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    /// Allows users to deposit tokens into the vault.
    pub fn deposit(ctx: Context<TokenTransfer>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Check that the user's token account has the correct mint
        if ctx.accounts.user_token_account.mint != vault.token_mint {
            return Err(ErrorCode::InvalidMint.into());
        }

        // Transfer tokens from user to vault's token account
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        // Update user's deposit in vault
        let user_key = ctx.accounts.user.key();
        if let Some((_, user_deposit)) = vault
            .user_deposits
            .iter_mut()
            .find(|(pk, _)| *pk == user_key)
        {
            // User already has a deposit, so increase the amount
            *user_deposit = user_deposit.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        } else {
            // User doesn't have a deposit yet, so add a new entry
            vault.user_deposits.push((user_key, amount));
        }

        // Update total deposits in vault
        vault.total_deposits = vault.total_deposits.checked_add(amount).ok_or(ErrorCode::Overflow)?

        Ok(())
    }

    /// Allows users to withdraw tokens they have deposited into the vault.
    pub fn withdraw(ctx: Context<TokenTransfer>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user_key = ctx.accounts.user.key();

        // Find the user's deposit
        let user_deposit = vault
            .user_deposits
            .iter_mut()
            .find(|(pk, _)| *pk == user_key)
            .ok_or(ErrorCode::InsufficientFunds)?;

        // Decrease user's deposit while  
        // checking if the user has enough deposit using checked_sub
        user_deposit.1 = user_deposit.1.checked_sub(amount).ok_or(ErrorCode::InsufficientFunds)?;

        if user_deposit.1 == 0 {
            // Remove the entry if the deposit is zero
            vault.user_deposits.retain(|(pk, _)| pk != &user_key);
        }

        // Decrease total deposits in vault using checked_sub
        vault.total_deposits = vault.total_deposits.checked_sub(amount).ok_or(ErrorCode::Overflow)?;

        // Store the necessary information for the CPI before mutating the vault
        // let vault_key = *vault.to_account_info().key;
        let vault_bump = vault.bump;
        let vault_token_mint = vault.token_mint;

        // Now you can safely mutate the vault before performing the CPI
        let seeds: &[&[u8]] = &[b"vault", vault_token_mint.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = manager,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 8 + (32 + 8) * 100
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = manager,
        seeds = [b"vault_token", vault.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub manager: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TokenTransfer<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Vault {
    pub manager: Pubkey,                   // The manager of the vault (PDA)
    pub token_mint: Pubkey,                // The mint of the token stored in the vault
    pub total_deposits: u64,               // Total amount of tokens in the vault
    pub user_deposits: Vec<(Pubkey, u64)>, // Mapping of user pubkey to their deposit amount in the vault
    pub bump: u8,                          // Bump for the PDA
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid token mint.")]
    InvalidMint,
    #[msg("Insufficient funds.")]
    InsufficientFunds,
    #[msg("Overflow occurred.")]
    Overflow,
}
