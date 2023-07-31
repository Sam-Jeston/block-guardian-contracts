import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolTweets } from "../target/types/sol_tweets";
import { expect } from "chai";

describe("sol-tweets", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolTweets as Program<SolTweets>;
  const anchorProvider = program.provider as anchor.AnchorProvider

  it('can send a new tweet', async () => {
      // Call the "SendTweet" instruction.
      const tweet = anchor.web3.Keypair.generate();
      await program.methods
        .sendTweet('Hummus, am I right?')
        .accounts({
          tweet: tweet.publicKey,
          author: anchorProvider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([tweet])
        .rpc()

      // Fetch the account details of the created tweet.
      const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
      expect(tweetAccount.author.toBase58()).to.eq(anchorProvider.wallet.publicKey.toBase58());
      expect(tweetAccount.content).to.eq('Hummus, am I right?');
      expect(tweetAccount.timestamp).to.not.be.null;
  });

  it('can send a new tweet from another author', async () => {
      const otherUser = anchor.web3.Keypair.generate();
      const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000000)
      await program.provider.connection.confirmTransaction(signature);

      // Call the "SendTweet" instruction.
      const tweet = anchor.web3.Keypair.generate();
      await program.methods
        .sendTweet('Hummus, am I right?')
        .accounts({
          tweet: tweet.publicKey,
          author: otherUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherUser, tweet])
        .rpc()

      // Fetch the account details of the created tweet.
      const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
      expect(tweetAccount.author.toBase58()).to.eq(otherUser.publicKey.toBase58());
      expect(tweetAccount.content).to.eq('Hummus, am I right?');
      expect(tweetAccount.timestamp).to.not.be.null;
  });

  it('cannot send a tweet with more than 280 chars', async () => {
      // Call the "SendTweet" instruction.
      try {
        const tweet = anchor.web3.Keypair.generate();
        const contentWith281Chars = 'x'.repeat(281)
        await program.methods
          .sendTweet(contentWith281Chars)
          .accounts({
            tweet: tweet.publicKey,
            author: anchorProvider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([tweet])
          .rpc()
      } catch (e) {
        expect(e.error.errorMessage).to.eq('The provided content should be 280 characters long maximum.')
        return
      }

      throw new Error('Should have failed');
  });
});
