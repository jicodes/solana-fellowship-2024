use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, Token};

declare_id!("X3zrnQrdPsK6nhKcWC5cTZFUXhTzHy5QqqB9xFSC46o");

#[program]
mod asset_manager_vault {
    use super::*;

    // Initialize the vault with a manager and a specific SPL token mint
    pub fn initialize_vault(ctx: Context<InitializeVault>, mint: Pubkey) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.manager = *ctx.accounts.manager.key;
        vault.mint = mint;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {

        if amount <= 0 {
            return Err(ErrorCode::InvalidDepositAmount.into());
        }

        if ctx.accounts.user_token_account.mint != ctx.accounts.vault.mint {
            return Err(ErrorCode::InvalidMint.into());
        }

        // Invoke the transfer instruction on the token program
        let cpi_ix = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_ix);
        token::transfer(cpi_ctx, amount)?;

        // Update or create the user's deposit PDA account
        let user_deposit = &mut ctx.accounts.user_deposit;
        user_deposit.amount += amount;

        msg!("Deposited {} tokens successfully.", amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        seeds = [b"vault", manager.key().as_ref()],
        bump,
        payer = manager,
        space = 8 + 32 + 32 // Space for the account discriminator, manager Pubkey, and mint Pubkey
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub manager: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"vault", vault.manager.as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        seeds = [b"user_deposit", user.key().as_ref(), vault.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 8  // Space for the account discriminator and deposit amount (u64)
    )]
    pub user_deposit: Account<'info, UserDeposit>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Vault {
    pub manager: Pubkey, 
    pub mint: Pubkey,    
}

#[account]
pub struct UserDeposit {
    pub amount: u64,     
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided mint does not match the vault's mint.")]
    InvalidMint,
    #[msg("The deposit amount must be greater than zero.")]
    InvalidDepositAmount,
}