# farcaster-snapchain-utils

## Description

This is a library to simplify the interaction with a Farcaster snapchain node.

It can be used in read-only mode or in read/write mode.

If you use it in read/write mode, you will need to provide a private key and a FID.

If a node is not provided, the library will use the Pinata public node.

You can also use it with Neynar, provided you pass the NEYNAR_API_KEY to the constructor or to changeNode the method.

The library allows you to change the node or signer, so you don't need to create a new instance every time you want to change the node or signer.

## Full documentation

Docs: [https://andrei0x309.gitbook.io/farcaster-snapchain-utils/](https://andrei0x309.gitbook.io/farcaster-snapchain-utils/)

## Quickstart

### Usage  - read-only with the public node from Pinata

```typescript
import { SnapChainClient } from 'farcaster-snapchain-utils'

const client = SnapChainClient();

// client.method... -> must be a read method only, or it will throw an error

```

### - read-write with your node

```typescript
import { SnapChainClient } from 'farcaster-snapchain-utils'

const userFid = 1791;
// Example signer must be a valid signer of the FID
const signer = "0x222ab147ccbaa2dc660717f28ea4aaeea13b93fe9df297669efdd12f7c1669df";

const client = new SnapChainClient({
    FID: userFid,
    PK: signer,
    NODE_URL: 'hub-grpc.pinata.cloud', // your node domain, ex, node.fosscaster.xyz
    NODE_USER: '', // node auth user if needed
    NODE_PASS: '', // node auth password if needed 
}) 

// client.method... -> you can call read/write methods like follow / createCast, etc


```

### - read-write with Neynar Key

```typescript
import { SnapChainClient } from 'farcaster-snapchain-utils'

const userFid = 1791;
// Example signer must be a valid signer of the FID
const signer = "0x222ab147ccbaa2dc660717f28ea4aaeea13b93fe9df297669efdd12f7c1669df";
// Example of a Neynar api key must be valid
const NEYNAR_API_KEY = "A02E9451-6CFB-25B0-238E-15E18F2264DA"; 

const clientNeynar = new SnapChainClient({
    FID: userFid,
    PK: signer,
    NEYNAR_API_KEY,
});

// client.method... -> you can call read/write methods like follow / createCast, etc
```

### - add/change node later

You can also add or change either the node or key later, which is useful for avoiding creating multiple instances of `SnapChainClient` if you don't need to.

```typescript
import { SnapChainClient } from 'farcaster-snapchain-utils'

const client = SnapChainClient();

// changed to specific node 
client.changeNode({
NODE_URL: 'node.fosscaster.xyz',
NODE_USER: 'secret-user',
NODE_PASS: 'secret-pass'
})

//changed to using Neynar node
client.changeNode({
NEYNAR_API_KEY: 'my-secret-api-key',
})

```

`changeNode`needs either `NODE_URL` or `NEYNAR_API_KEY` if neither is provided, it will throw an error; if both are provided, it will default to using the Neynar key instead of the node.\

### - add/change user (signer/fid) later

```typescript
import { SnapChainClient } from 'farcaster-snapchain-utils'

const client = SnapChainClient();

// changed to specific signer
client.changeSigner({
FID: 1791, // a public user fid
// my secret signer PK
PK: '0x1111111111111111111111111111111111111111111111111111111111111111' 
})

await client.follow(3) // follow dwr.eth with user andrei0x309

client.changeSigner({
FID: 3, // a public user fid
// my secret signer PK
PK: '0x1111111111111111111111111111111111111111111111111111111111111111' 
})

await client.follow(1791) // follow andrei0x309 with user dwr.eth
```

## License

MIT
