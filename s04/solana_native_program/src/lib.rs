use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
};

entrypoint!(process_instruction);

#[derive(Debug)]
pub enum SolDepositWithdrawError {
    InvalidInstruction,
    InsufficientFunds,
}

// Implementing conversion from SolDepositWithdrawError to ProgramError
impl From<SolDepositWithdrawError> for ProgramError {
    fn from(e: SolDepositWithdrawError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

// Define the vault state
#[derive(BorshSerialize, BorshDeserialize)]
pub struct VaultAccountState {
    pub is_initialized: bool,
    pub deposit: u64,
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    match instruction_data[0] {
        0 => initialize_account(program_id, accounts_iter),
        1 => deposit_sol(program_id, accounts_iter),
        2 => withdraw_sol(program_id, accounts_iter),
        _ => Err(SolDepositWithdrawError::InvalidInstruction.into()),
    }
}

fn initialize_account(
    program_id: &Pubkey,
    accounts: &mut std::slice::Iter<AccountInfo>,
) -> ProgramResult {
    let initializer = next_account_info(accounts)?;
    let pda_account = next_account_info(accounts)?;
    let system_program = next_account_info(accounts)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref()], program_id);

    if pda != *pda_account.key {
        msg!("Provided PDA does not match the derived PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    let account_len = std::mem::size_of::<VaultAccountState>();
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    let create_account_ix = system_instruction::create_account(
        initializer.key,
        pda_account.key,
        rent_lamports,
        account_len as u64,
        program_id,
    );

    invoke_signed(
        &create_account_ix,
        &[
            initializer.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        &[&[initializer.key.as_ref(), &[bump_seed]]],
    )?;

    // Initialize the account state
    let mut vault_state = VaultAccountState {
        is_initialized: true,
        deposit: 0,
    };

    vault_state.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;

    msg!("PDA account created and initialized: {}", pda_account.key);

    Ok(())
}

fn deposit_sol(program_id: &Pubkey, accounts: &mut std::slice::Iter<AccountInfo>) -> ProgramResult {
    let depositor = next_account_info(accounts)?;
    let vault_account = next_account_info(accounts)?;

    let deposit_amount = **depositor.lamports.borrow();
    if deposit_amount == 0 {
        msg!("Deposit amount is zero");
        return Err(SolDepositWithdrawError::InsufficientFunds.into());
    }

    if vault_account.owner != program_id {
        msg!("Vault account is not owned by the program");
        return Err(ProgramError::IncorrectProgramId);
    }

    // The ** is used to dereference the mutable borrow of the lamports,
    // allowing direct manipulation of the underlying u64 value that represents the account’s balance.
    **depositor.lamports.borrow_mut() -= deposit_amount;
    **vault_account.lamports.borrow_mut() += deposit_amount;

    let mut vault_state = VaultAccountState::try_from_slice(&vault_account.data.borrow())?;
    vault_state.deposit += deposit_amount;

    vault_state.serialize(&mut &mut vault_account.data.borrow_mut()[..])?;

    msg!(
        "Deposited {} lamports from {} to {}",
        deposit_amount,
        depositor.key,
        vault_account.key
    );

    Ok(())
}

fn withdraw_sol(
    program_id: &Pubkey,
    accounts: &mut std::slice::Iter<AccountInfo>,
) -> ProgramResult {
    let vault_account = next_account_info(accounts)?;
    let receiver = next_account_info(accounts)?;

    if vault_account.owner != program_id {
        msg!("Vault account is not owned by the program");
        return Err(ProgramError::IncorrectProgramId);
    }

    let vault_account_balance = **vault_account.lamports.borrow();
    if vault_account_balance == 0 {
        msg!("Vault account balance is zero");
        return Err(SolDepositWithdrawError::InsufficientFunds.into());
    }

    let withdraw_amount = vault_account_balance / 10; // 10% of the account balance
    if withdraw_amount == 0 {
        msg!("Withdrawal amount is too small to process");
        return Err(SolDepositWithdrawError::InsufficientFunds.into());
    }

    **vault_account.lamports.borrow_mut() -= withdraw_amount;
    **receiver.lamports.borrow_mut() += withdraw_amount;

    let mut vault_state = VaultAccountState::try_from_slice(&vault_account.data.borrow())?;
    vault_state.deposit -= withdraw_amount;

    vault_state.serialize(&mut &mut vault_account.data.borrow_mut()[..])?;

    msg!(
        "Withdrew {} lamports from {} to {}",
        withdraw_amount,
        vault_account.key,
        receiver.key
    );

    Ok(())
}
