# Block Guardian Verifier Contracts

## Design Considerations / TODOs
- Add a toll if the caller of the program is not the "toll free" account. This will let us expose a nice UX for users to pay for their own transactions, while we still make a small amount of $. The toll free account will be used for us handling txs for web2 users

## Anchor
`anchor test`
## Anchor Tutorial
https://lorisleiva.com/create-a-solana-dapp-from-scratch/testing-our-instruction

## Merkle Trees
Using open zepplin merkle tree library