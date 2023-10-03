use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_lang::prelude::Pubkey;

declare_id!("GXmYkn4SKCj1uE7CV83pcnoaVjb857H3oYyhbs1sdXPM");

#[program]
pub mod block_guardian_verifier {

    use super::*;

    pub fn store_proof(ctx: Context<CreateProof>, proof: [u8; 32]) -> Result<()> {
        let proof_account: &mut Account<Proof> = &mut ctx.accounts.proof_account;
        let clock: Clock = Clock::get().unwrap();

        proof_account.timestamp = clock.unix_timestamp;
        proof_account.proof = proof;
        proof_account.creator = *ctx.accounts.creator.key;

        Ok(())
    }
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
}

const DISCRIMINATOR_LENGTH: usize = 8;
const UNIX_TIMESTAMP_LENGTH: usize = 8;
const PUBKEY_SIZE: usize = 32;
const MAX_PROOF_LENGTH: usize = 32;

impl Proof {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + UNIX_TIMESTAMP_LENGTH // length of the unix timestamp
        + PUBKEY_SIZE // length of the creator pubkey
        + MAX_PROOF_LENGTH; // length of the unix timestamp
}