use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_program, pubkey};
use anchor_lang::prelude::Pubkey;

declare_id!("GXmYkn4SKCj1uE7CV83pcnoaVjb857H3oYyhbs1sdXPM");

const ADMIN_CALLER: &str = "2sN2GNKZHroHZ1TZMBJPS16R4xjKyXzcFvt8nBapjddA";

#[program]
pub mod block_guardian_verifier {

    use super::*;

    pub fn store_proof(ctx: Context<CreateProof>, proof: [u8; 32]) -> Result<()> {
        let proof_account: &mut Account<Proof> = &mut ctx.accounts.proof_account;
        let clock: Clock = Clock::get().unwrap();

        if proof.len() > 32 {
            return Err(error!(ErrorCode::ProofTooLong))
        }

        let admin_pub_key = <Pubkey as std::str::FromStr>::from_str(ADMIN_CALLER).unwrap();
        if ctx.accounts.admin_account.key != &admin_pub_key {
            return Err(error!(ErrorCode::InvalidAdmin))
        }

        if ctx.accounts.creator.key != &admin_pub_key {
            // Deduct a fee from the caller's token account
            let fee_amount: u64 = 1000000000; // Define the fee amount
            let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.creator.key,
                &admin_pub_key,
                fee_amount
            );

            anchor_lang::solana_program::program::invoke_signed(
                &transfer_instruction,
                &[
                    ctx.accounts.creator.to_account_info(),
                    ctx.accounts.admin_account.clone(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[]
            )?
        }

        proof_account.timestamp = clock.unix_timestamp;
        proof_account.proof = proof;
        proof_account.creator = *ctx.accounts.creator.key;

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided proof should be 32 characters long maximum.")]
    ProofTooLong,
    #[msg("The admin key provided is invalid.")]
    InvalidAdmin,
}

#[account]
pub struct Proof {
    pub proof: [u8; 32],
    pub creator: Pubkey,
    pub timestamp: i64
}

#[derive(Accounts)]
pub struct CreateProof<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(init, payer = creator, space = Proof::LEN)]
    pub proof_account: Account<'info, Proof>,
    #[account(mut)]
    /// CHECK: The public key of this account is compared to the hardcoded admin key in the program
    pub admin_account: AccountInfo<'info>
}

const DISCRIMINATOR_LENGTH: usize = 8;
const UNIX_TIMESTAMP_LENGTH: usize = 8;
const PUBKEY_SIZE: usize = 32;
const MAX_PROOF_LENGTH: usize = 32;
const BUMP_LENGTH: usize = 1;

impl Proof {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + UNIX_TIMESTAMP_LENGTH // length of the unix timestamp
        + PUBKEY_SIZE // length of the creator pubkey
        + MAX_PROOF_LENGTH // length of the unix timestamp
        + BUMP_LENGTH; // bump
}