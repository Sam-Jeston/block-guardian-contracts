# Block Guardian Verifier Contracts

The purpose of this contract is to allow users to store 32 bytes of arbitrary data on-chain, recording the timestamp the data was persisted and who persisted it. This contract is designed to solve auditibilty issues faced by existing web2 companies. There are a number of circumstances where you want to keep your data private, but also want to be able to prove that a file has existed in its current form since a certain date. This contract allows you to do that by either submitting SHA256 hashes directly to the contract, or by instead storing the root of a merkle tree.

Some real-world examples of when this is useful:

- When a company is audited, they can present the hashes of their financial records to the auditor. This allows the auditor to verify that the financial records have not been tampered with.
- While creating custom IP, the creator can store the hashes of their files on-chain. This allows the creator to prove that has the IP in their possession at a certain date. This does not prove that they created the IP, but in the event someone claims to have created it after that time, the creator can prove that they had the IP first.
- During evidence collection, a number of photos / documents / media files are collected. These files are then hashed and the hashes are stored on-chain. This allows the investigating party to prove that the files have not been tampered with since the time of collection.
- When making insurance claims, any files submitted that support ownership / state of property prior to the claim can be verified by the insurance company. This allows the insurance company to have confidence that the files submitted are not fraudulent.

## Development

### Interacting with the program

The tests in `tests/block-guardian-verifier.ts` show how to interact with the program.

### Run the Tests

`anchor test`
