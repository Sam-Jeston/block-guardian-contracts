import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockGuardianVerifier } from "../target/types/block_guardian_verifier";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { PublicKey } from '@solana/web3.js'

const ADMIN_ADDRESS = '2sN2GNKZHroHZ1TZMBJPS16R4xjKyXzcFvt8nBapjddA'

describe("block-guardian-verifier", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .BlockGuardianVerifier as Program<BlockGuardianVerifier>;

  it("can create a new proof", async () => {
    // (1)
    const values = [["car"], ["case"], ["bat"], ["ball"], ["foo"], ["lee"]];

    // (2)
    const tree = StandardMerkleTree.of(values, ["string"]);

    // (3)
    console.log("Merkle Root:", tree.root);

    const verified = StandardMerkleTree.verify(
      tree.root,
      ["string"],
      ["ball"],
      tree.getProof(3)
    );
    console.log(tree.getProof(3))
    console.log(JSON.stringify(tree.dump(), null, 2));
    console.log({ verified });

    const initialAdminBlanace = await program.provider.connection.getBalance(new PublicKey(ADMIN_ADDRESS))
    console.log(initialAdminBlanace.toString())

    const proofKeypair = anchor.web3.Keypair.generate();
    await program.methods
      .storeProof(hexToUint8Array(tree.root))
      .accounts({
        proofAccount: proofKeypair.publicKey,
        adminAccount: new PublicKey(ADMIN_ADDRESS),
        // creator: anchorProvider.wallet.publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proofKeypair])
      .rpc();
  
    // Fetch the account details of the created tweet.
    const proofAccounts = await program.account.proof.all([
      {
        dataSize: 81, // number of bytes of the expected account
      },
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: hexToBase58(tree.root),
        }
      }
    ]);
    console.log({ proofAccount: '0x' + Buffer.from(proofAccounts[0].account.proof).toString('hex') });
    console.log(JSON.stringify(proofAccounts[0], null, 2))
    const postAdminBalance = await program.provider.connection.getBalance(new PublicKey(ADMIN_ADDRESS))
    console.log(postAdminBalance.toString())


    const noProof = await program.account.proof.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: hexToBase58('0xe4faa4a13f8f3562287edfad7e089f7c7ef0135c00190e6d8772eab67dad61f7'),
        }
      }
    ]);

    console.log({noProof})
  });

  it("fails if a bad admin account is sent", async () => {
    // (1)
    const values = [["car"], ["case"], ["bat"], ["ball"], ["foo"], ["lee"]];

    // (2)
    const tree = StandardMerkleTree.of(values, ["string"]);

    // (3)
    console.log("Merkle Root:", tree.root);

    const verified = StandardMerkleTree.verify(
      tree.root,
      ["string"],
      ["ball"],
      tree.getProof(5)
    );
    console.log(tree.dump());
    console.log({ verified });

    const initialAdminBlanace = await program.provider.connection.getBalance(new PublicKey(ADMIN_ADDRESS))
    console.log(initialAdminBlanace.toString())

    const proofKeypair = anchor.web3.Keypair.generate();
    await program.methods
      .storeProof(hexToUint8Array(tree.root))
      .accounts({
        proofAccount: proofKeypair.publicKey,
        adminAccount: new PublicKey('3sN2GNKZHroHZ1TZMBJPS16R4xjKyXzcFvt8nBapjddA'),
        // creator: anchorProvider.wallet.publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([proofKeypair])
      .rpc();
  
    // Fetch the account details of the created tweet.
    const proofAccounts = await program.account.proof.all([
      {
        dataSize: 81, // number of bytes of the expected account
      },
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: hexToBase58(tree.root),
        }
      }
    ]);
    console.log({ proofAccount: '0x' + Buffer.from(proofAccounts[0].account.proof).toString('hex') });
    console.log(JSON.stringify(proofAccounts[0], null, 2))
    const postAdminBalance = await program.provider.connection.getBalance(new PublicKey(ADMIN_ADDRESS))
    console.log(postAdminBalance.toString())


    const noProof = await program.account.proof.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: hexToBase58('0xe4faa4a13f8f3562287edfad7e089f7c7ef0135c00190e6d8772eab67dad61f7'),
        }
      }
    ]);

    console.log({noProof})
  });

  // it('can send a new tweet from another author', async () => {
  //     const otherUser = anchor.web3.Keypair.generate();
  //     const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000000)
  //     await program.provider.connection.confirmTransaction(signature);

  //     // Call the "SendTweet" instruction.
  //     const tweet = anchor.web3.Keypair.generate();
  //     await program.methods
  //       .sendTweet('Hummus, am I right?')
  //       .accounts({
  //         tweet: tweet.publicKey,
  //         author: otherUser.publicKey,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       })
  //       .signers([otherUser, tweet])
  //       .rpc()

  //     // Fetch the account details of the created tweet.
  //     const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
  //     expect(tweetAccount.author.toBase58()).to.eq(otherUser.publicKey.toBase58());
  //     expect(tweetAccount.content).to.eq('Hummus, am I right?');
  //     expect(tweetAccount.timestamp).to.not.be.null;
  // });

  // it('cannot send a tweet with more than 280 chars', async () => {
  //     // Call the "SendTweet" instruction.
  //     try {
  //       const tweet = anchor.web3.Keypair.generate();
  //       const contentWith281Chars = 'x'.repeat(281)
  //       await program.methods
  //         .sendTweet(contentWith281Chars)
  //         .accounts({
  //           tweet: tweet.publicKey,
  //           author: anchorProvider.wallet.publicKey,
  //           systemProgram: anchor.web3.SystemProgram.programId,
  //         })
  //         .signers([tweet])
  //         .rpc()
  //     } catch (e) {
  //       expect(e.error.errorMessage).to.eq('The provided content should be 280 characters long maximum.')
  //       return
  //     }

  //     throw new Error('Should have failed');
  // });
});

function hexToUint8Array(hexString): number[] {
  // Filter off 0x from the hex string
  return hexString.match(/.{1,2}/g).filter(pair => pair !== '0x').map(byte => parseInt(byte, 16));
}

function hexToBase58(hexString): string {
  return anchor.utils.bytes.bs58.encode(hexToUint8Array(hexString))
}
