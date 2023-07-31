use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("Gns3vGyjsn9L8jticbLGBug1rwm9qrUJCuHETPCHbfig");

#[program]
pub mod sol_tweets {

    use super::*;

    pub fn send_tweet(ctx: Context<SendTweet>, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if content.chars().count() > 280 {
            return Err(error!(ErrorCode::ContentTooLong))
        }

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.content = content;

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}

#[derive(Accounts)]
pub struct Initialize {}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub content: String,
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
}