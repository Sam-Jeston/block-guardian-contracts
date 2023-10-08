import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { BlockGuardianVerifier } from '../target/types/block_guardian_verifier'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { expect } from 'chai'

describe('block-guardian-verifier', () => {
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace
    .BlockGuardianVerifier as Program<BlockGuardianVerifier>

  // This test is a good example of how the contract can be used to store a proof
  // for multiple files by storing the root of a merkle tree instead of a sha256 hash directly.
  // The tree shored be stored in immutable, publicly accessible storage somewhere off-chain so that
  // the files can always be verified
  it('can store a merkle tree root on-chain', async () => {
    const fileHashes = [
      ['0x27b506fb70a825eeee33b167e5995ce050b609bb8718863cfe17c9cfb98fcacd'],
      ['0x4089caf31ddd6d66ecd13ded600af070f179b5a8292eb2ffac2237cecd4953db'],
      ['0xa2d2510f195d4f8985e19718f1f28fbe9247a79f6716caaa7ab90b2af4788bab'],
    ]

    const tree = StandardMerkleTree.of(fileHashes, ['string'])

    const proofKeypair = anchor.web3.Keypair.generate()
    await program.methods
      .storeProof(hexToUint8Array(tree.root))
      .accounts({
        proofAccount: proofKeypair.publicKey,
      })
      .signers([proofKeypair])
      .rpc()

    // Show that the proof account was created and how it can be queried
    // on-chain
    const proofAccounts = await program.account.proof.all([
      {
        dataSize: 80, // number of bytes of the expected account
      },
      {
        memcmp: {
          offset: 8, // 8 byte offset for the discriminator.
          bytes: hexToBase58(tree.root),
        },
      },
    ])

    const rootVerifiedOnChain =
      '0x' + Buffer.from(proofAccounts[0].account.proof).toString('hex')
    const verified = StandardMerkleTree.verify(
      rootVerifiedOnChain,
      ['string'],
      ['0x4089caf31ddd6d66ecd13ded600af070f179b5a8292eb2ffac2237cecd4953db'],
      // This tree object can be rebuilt by the tree stored off-chain on Immutable storage
      tree.getProof(1)
    )

    expect(verified).to.be.true
  })

  // This is a very interesting consequence that I didn't expect. When parsing in dynamiclly sized data
  // to program methods (i.e String), if persisting the data you need to validate the size of the data.
  // When exposing a method that excepts a byte array of a fixed size, contract validation does nothing
  // as the size of the data is guaranteed to be the fixed size. I probably would have expected anchor to
  // potentially throw from the client code in this instance
  it('if the proof is more than 32 bytes, the first 32 bytes are persisted as the proof', async () => {
    const validHash =
      '0xa2d2510f195d4f8985e19718f1f28fbe9247a79f6716caaa7ab90b2af4788bab'
    const oversizedHash = `${validHash}ababab`

    const proofKeypair = anchor.web3.Keypair.generate()
    await program.methods
      .storeProof(hexToUint8Array(oversizedHash))
      .accounts({
        proofAccount: proofKeypair.publicKey,
      })
      .signers([proofKeypair])
      .rpc()

    const proofAccounts = await program.account.proof.all([
      {
        dataSize: 80, // number of bytes of the expected account
      },
      {
        memcmp: {
          offset: 8, // 8 byte offset for the discriminator.
          bytes: hexToBase58(validHash),
        },
      },
    ])

    const hashVerifiedOnChain =
      '0x' + Buffer.from(proofAccounts[0].account.proof).toString('hex')

    expect(hashVerifiedOnChain).to.equal(validHash)
    expect(proofAccounts[0].account.submitter.toBase58()).to.equal(
      anchor.getProvider().publicKey.toBase58()
    )
  })
})

function hexToUint8Array(hexString): number[] {
  // Filter off 0x from the hex string
  return hexString
    .match(/.{1,2}/g)
    .filter((pair) => pair !== '0x')
    .map((byte) => parseInt(byte, 16))
}

function hexToBase58(hexString): string {
  return anchor.utils.bytes.bs58.encode(hexToUint8Array(hexString))
}
