import { expect, test } from "bun:test";
import { SnapChainClient } from '../src/index'

const SIGNER_KEY = process.env.SIGNER_KEY as string;
const SIGNER_KEY2 = process.env.SIGNER_KEY2 as string;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY as string;
const FID = Number(process.env.FID as string);
const FID2 = Number(process.env.FID2 as string);
const NODE_URL = process.env.NODE_URL;


const client1 = new SnapChainClient({
    FID: FID,
    PK: SIGNER_KEY,
}); // default hub-grpc.pinata.cloud

const client2 = new SnapChainClient({
    FID: FID2,
    PK: SIGNER_KEY2,
    NODE_URL: 'hub-grpc.pinata.cloud',
    NODE_USER: '',
    NODE_PASS: '',
}) // simulate an own node client

const clientNeynar = new SnapChainClient({
    FID: FID,
    PK: SIGNER_KEY,
    NEYNAR_API_KEY: NEYNAR_API_KEY,
}) // neynar node client

let testOrSkip: typeof test | typeof test.skip;

const testEnabled = {
    "getFidFromUsername": false,
    "createFarcasterPost": false,
    "createCast": false,
    "removeCast": false,
    "getCastsFromFid": false,
    "testChangeHub": false,
    "testChangeSigner": false,
    "test6Medias": false,
    "testCastInNonExistentChannel": false,
    "testCastWithAllMediaInOneURL": false,
    "testPublicHub": false,
    "calculateFollowingsByfid": false,
    "checkVerifiedAddr": false
}

testOrSkip = testEnabled.getFidFromUsername ? test : test.skip;
testOrSkip("Get fid By name", async () => {
    expect(await client1.getFidFromUsername("clearwallet")).toBe(FID);
});

testOrSkip = testEnabled.createFarcasterPost ? test : test.skip;
testOrSkip("Test send cast", async () => {
    const text = "Test @andrei0x309";
    const castHash = await clientNeynar.createFarcasterPost({
        content: text
    });
    const stringHash = Buffer.from(castHash).toString('hex');
    console.log(castHash);
    expect(stringHash).toBeDefined();
});

testOrSkip = testEnabled.createCast ? test : test.skip;
testOrSkip("Test send cast", async () => {
    const text = "5";
    const castHash = await clientNeynar.createCast({
        content: text
    })
    const stringHash = Buffer.from(castHash).toString('hex');
    console.log(castHash);
    expect(stringHash).toBeDefined();
}, { timeout: 30000 });

testOrSkip = testEnabled.removeCast ? test : test.skip;
testOrSkip("Test remove cast", async () => {
    const hash = '69a3d03b3d90f0901ed71f4e243a5b383d7e1497'
    const castHash = await clientNeynar.deleteCast(hash)
    expect(castHash).toBeTrue();
}, { timeout: 20000 });

testOrSkip = testEnabled.getCastsFromFid ? test : test.skip;
testOrSkip("Get cast by FID", async () => {
    const FID = 1791
    const casts = await client1.getCastsByFid({
        fid: FID,
        itemsPerRequests: 50,
        fromTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 20,
        toTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 10,
        fetchUntilNoDataLeft: true,
        maximumCastsFetched: 500,
        delayBetweenRequests: 500
    });
 
    console.log(casts?.casts?.length);
    // console.log(new Date(casts?.casts[0].timestamp ?? 0).toISOString());

    expect(casts).toBeDefined();
}, { timeout: 500000 })

 
testOrSkip = testEnabled.testChangeHub ? test : test.skip;
testOrSkip("Test change hub", async () => {

    const oldNodeInfo = await clientNeynar.getNodeInfo();

    await clientNeynar.changeNode({
        NODE_URL
    });

    const nodeInfo = await clientNeynar.getNodeInfo();

    console.info(`Old Fid Operator: ${oldNodeInfo?.operatorFid}`);
    console.info(`New Fid Operator: ${nodeInfo?.operatorFid}`);

    expect(nodeInfo?.operatorFid).not.toBe(oldNodeInfo?.operatorFid);
   
});


testOrSkip = testEnabled.testChangeSigner ? test : test.skip;
testOrSkip("Test change signer", async () => {
    await client1.changeSigner({
        PK: SIGNER_KEY2,
        FID: FID2
    });
    expect(await client1.getFidFromUsername("yuptester")).toBe(FID2);
});

testOrSkip = testEnabled.test6Medias ? test : test.skip;
testOrSkip("Test 6 medias", async () => {

    const id = 237
    const getUrl = (id) => `https://picsum.photos/id/${id}/200/300`

    const text = "Test 6 medias";
    const castHash = await client2.createFarcasterPost({
        content: text,
        media: Array.from({ length: 6 }, (_, i) => getUrl(id + i)).map(url => ({ farcaster: url }))
    });
    const stringHash = Buffer.from(castHash).toString('hex');
    await new Promise(resolve => setTimeout(resolve, 15000));
    const cast = await client2.getCastFromHash(stringHash, FID2)
    console.log(cast);
    expect(cast).toBeDefined();
}, {
    timeout: 50000
})

testOrSkip = testEnabled.testCastInNonExistentChannel ? test : test.skip;
testOrSkip("Test cast in non existent channel", async () => {
    const text = "Test cast in non existent channel";
    const castHash = await client2.createFarcasterPost({
        content: text,
        replyTo: "https://warpcast.com/~/channel/fosscaster"
    });
    const stringHash = Buffer.from(castHash).toString('hex');
    console.log(castHash);
    expect(stringHash).toBeDefined();
});

testOrSkip = testEnabled.testCastWithAllMediaInOneURL ? test : test.skip;
testOrSkip("Test cast with all media in one URL", async () => {

        const id = 237
    const getUrl = (id) => `https://picsum.photos/id/${id}/200/300`

    const text = "Test cast with all media in one URL";
    const largeURLsStrings = Array.from({ length: 6 }, (_, i) => getUrl(id + i)).reduce((acc: string, url: string) => {
        if (acc.length === 0) {
           return url
        } else if ( !acc?.includes('?')) {
            return acc + '?embeds[]=' + url
        } else {
            return acc + ',' + url
        }
    }, "") as string
    console.log(largeURLsStrings.length)
    const castHash = await client2.createFarcasterPost({
        content: text,
        media: [largeURLsStrings].map(url => ({ farcaster: url }))
    });
    const stringHash = Buffer.from(castHash).toString('hex');
    console.log(castHash);
    expect(stringHash).toBeDefined();
}, {
    timeout: 20000
})

testOrSkip = testEnabled.calculateFollowingsByfid ? test : test.skip;
testOrSkip("Calculate followings by fid", async () => {
    const followings = await client2.getAllLinksByFid({
        fid: 1791,
        itemsPerRequests: 100,
        fromTimestamp: Date.now(),
        toTimestamp:  Date.now() - 1000 * 60 * 60 * 24 * 180,
    })
    console.log(followings);
    expect(followings).toBeDefined();
}, {
    timeout: 20000
})


testOrSkip = testEnabled.checkVerifiedAddr ? test : test.skip;
testOrSkip("Check last verified addresses", async () => {
    const connectedAddresses = await client2.getConnectedAddresses({
        fid: 1791
    })
    console.log(connectedAddresses);
    expect(connectedAddresses).toBeDefined();
}, {
    timeout: 20000
})