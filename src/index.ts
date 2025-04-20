import {
    makeCastRemove,
    NobleEd25519Signer,
    FarcasterNetwork,
    makeCastAdd,
    CastAddBody,
    CastType,
    getSSLHubRpcClient,
    getAuthMetadata,
    Message,
    ReactionType,
    makeReactionAdd,
    makeReactionRemove,
    makeFrameAction,
    makeLinkAdd,
    makeLinkRemove,
    createDefaultMetadataKeyInterceptor,
    CastId,
    type FrameActionMessage,
    LinkBody,
    type MessageData
} from '@farcaster/hub-nodejs';

const FC_TIMESTMAP_OFFSET = 1609459200
type LinkType = 'follow'
const NEYNAR_NODE = 'hub-grpc-api.neynar.com'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
class SnapChainClient {
    private PK: string = "";
    private NODE_URL: string = "hub-grpc.pinata.cloud";
    private NODE_USER: string = "";
    private NODE_PASS: string = "";
    private signer: NobleEd25519Signer = new NobleEd25519Signer(Buffer.from('0x', 'hex'));
    private nodeClient: ReturnType<typeof getSSLHubRpcClient> = {} as any;
    private nodeClientAuthMetadata: ReturnType<typeof getAuthMetadata> = {} as any;
    private FID: number = 0;
    private hasAuth: boolean = false;
    private NEYNAR_API_KEY: string = "";

    constructor(
        {
            PK = '',
            FID = 0,
            NODE_URL = 'hub-grpc.pinata.cloud',
            NODE_USER = '',
            NODE_PASS = '',
            NEYNAR_API_KEY = '',
        }: {
            PK?: string,
            FID?: number,
            NODE_URL?: string,
            NODE_USER?: string,
            NODE_PASS?: string,
            NEYNAR_API_KEY?: string,
        } = {}
    ) {

        if (NEYNAR_API_KEY) {
            this.NEYNAR_API_KEY = NEYNAR_API_KEY;
            this.NODE_URL = NEYNAR_NODE;
        } else {
            if (NODE_URL) {
                if (NODE_URL.includes('//')) {
                    NODE_URL = NODE_URL.split('//')[1];
                }

                if (NODE_URL.includes('/')) {
                    NODE_URL = NODE_URL.split('/')[0];
                }

                this.NODE_URL = NODE_URL;
            }

            if (NODE_USER) {
                this.NODE_USER = NODE_USER;
            }

            if (NODE_PASS) {
                this.NODE_PASS = NODE_PASS;
            }
        }

        if (!PK || !FID) {
            this.hasAuth = false;
        } else {
            this.PK = PK;
            this.FID = FID;
            this.signer = new NobleEd25519Signer(Buffer.from(this.PK.replace('0x', ''), 'hex'));
        }

        const rcpOptions = {
            "grpc.max_send_message_length": 719e6,
            "grpc.max_receive_message_length": 719e6
        } as Record<string, any>;

        if (NEYNAR_API_KEY) {
            rcpOptions['interceptors'] = [
                createDefaultMetadataKeyInterceptor('x-api-key', NEYNAR_API_KEY),
            ]
        }

        this.nodeClient = getSSLHubRpcClient(this.NODE_URL, rcpOptions)
        this.nodeClientAuthMetadata = getAuthMetadata(this.NODE_USER, this.NODE_PASS)
    }

    checkSigner = (): void => {
        if (!this.hasAuth) {
            throw new Error('You can\'t publish a cast without authentication, please provide a signer private key and fid, using changeSigner method or constructor')
        }
    }

    changeSigner = ({
        PK,
        FID,
    }: {
        PK: string,
        FID: number,
    }): boolean => {
        try {
            if (!PK || !FID) {
                this.hasAuth = false;
                return false
            }
            this.signer = new NobleEd25519Signer(Buffer.from(PK.replace('0x', ''), 'hex'));
            this.PK = PK;
            this.FID = FID;
            this.hasAuth = true;
            return true
        } catch (e) {
            console.error(`Failed to change signer to PK=${PK} err=${e}`)
            return false
        }
    }

    changeNode = ({
        NODE_URL,
        NODE_USER,
        NODE_PASS,
        NEYNAR_API_KEY,
    }: {
        NODE_URL?: string,
        NODE_USER?: string,
        NODE_PASS?: string,
        NEYNAR_API_KEY?: string,
    }): void => {
        if (!NODE_URL || !NEYNAR_API_KEY) {
            throw new Error('changeNode: either NODE_URL or NEYNAR_API_KEY needs to be provided')
        }
        if (NEYNAR_API_KEY) {
            this.NEYNAR_API_KEY = NEYNAR_API_KEY;
            this.NODE_URL = NEYNAR_NODE;
        } else {
            if (NODE_URL) {
                if (NODE_URL.includes('//')) {
                    NODE_URL = NODE_URL.split('//')[1];
                }
                if (NODE_URL.includes('/')) {
                    NODE_URL = NODE_URL.split('/')[0];
                }
                this.NODE_URL = NODE_URL;

                if (NODE_USER) {
                    this.NODE_USER = NODE_USER;
                }
                if (NODE_PASS) {
                    this.NODE_PASS = NODE_PASS;
                }
            }
        }

        const rcpOptions = {
            "grpc.max_send_message_length": 719e6,
            "grpc.max_receive_message_length": 719e6
        } as Record<string, any>;

        if (NEYNAR_API_KEY) {
            rcpOptions['interceptors'] = [
                createDefaultMetadataKeyInterceptor('x-api-key', NEYNAR_API_KEY),
            ]
        }

        this.nodeClient = getSSLHubRpcClient(this.NODE_URL, rcpOptions)

        this.nodeClientAuthMetadata = getAuthMetadata(this.NODE_USER, this.NODE_PASS)
    }

    getCurentFID = (): number => {
        return this.FID;
    }

    getCurentNode = (): string => {
        return this.NODE_URL;
    }

    getCurrentSignerPk = (): string => {
        return this.PK;
    }

    getCurrentNeynarApiKey = (): string => {
        return this.NEYNAR_API_KEY;
    }

    publishCast = async (
        castAdd: CastAddBody,
    ): Promise<Uint8Array> => {
        if (!this.signer) {
            throw new Error('Failed to retrieve farcaster signer')
        }

        const dataOptions = {
            fid: this.FID,
            network: FarcasterNetwork.MAINNET
        }

        const cast = await makeCastAdd(
            castAdd,
            dataOptions,
            this.signer
        )

        if (!cast.isOk()) {
            throw new Error(cast._unsafeUnwrapErr().toString())
        }

        this.checkSigner()

        const castMessage = await this.nodeClient.submitMessage(cast._unsafeUnwrap(), this.nodeClientAuthMetadata)

        if (!castMessage.isOk()) {
            const hubError = castMessage._unsafeUnwrapErr().toString()
            console.error(`Failed to publish cast due to network error castAdd=${JSON.stringify(castAdd)} fid=${this.FID} err=${hubError}`)
            throw new Error(hubError)
        }

        return castMessage._unsafeUnwrap().hash
    }

    byteLength = (str: string): number => Buffer.byteLength(str, 'utf8')

    parseEmbeds (text: string): {
        url: string;
    }[] {
        const URL_REGEX = /http[s]?:\/\/.*?( |\n|\t|$){1}/igm
        return (text.match(URL_REGEX) || []).map((url) => url.replace(' ', '')).map((url) => {
            return { url }
        })
    }

    async parseFarcasterMentions (text: string): Promise<{
        mentions: number[];
        mentionsPositions: number[];
        mentionsText: string;
    }> {
        const reResults = [...text.matchAll(/@\w+(.eth)?/g)]
        const mentions: number[] = []
        const mentionsPositions: number[] = []
        let mentionsText = text
        let offset = 0
        for (const reResult of reResults) {
            const mention = reResult[0].slice(1)
            const position = this.byteLength(text.slice(0, (reResult.index)))
            const fid = await this.getFidFromUsername(mention)
            if (fid === null) {
                continue
            }
            mentions.push(fid)
            mentionsPositions.push(position - offset)
            mentionsText = mentionsText.replace(`@${mention}`, '')
            offset += this.byteLength(`@${mention}`)
        }

        return {
            mentions,
            mentionsPositions,
            mentionsText
        }
    }

    createFarcasterPost = async ({
        media = [] as Array<{ farcaster: string }>,
        content = '',
        replyTo = undefined as { hash: string; fid: string } | string | undefined,
    }: {
        media?: {
            farcaster: string;
        }[] | undefined;
        content?: string | undefined;
        replyTo?: string | {
            hash: string;
            fid: string;
        } | undefined;
    }): Promise<string> => {
        const text = content

        const byteLength = Buffer.byteLength(text, 'utf8')
        let isLongCast = false

        if (byteLength > 320) {
            isLongCast = true
        }

        if (byteLength > 1024) {
            throw new Error('Post exceeds Farcaster character limit')
        }

        const publishContent: CastAddBody = {
            text,
            mentions: [],
            mentionsPositions: [],
            embeds: [],
            embedsDeprecated: [],
            type: isLongCast ? CastType.LONG_CAST : CastType.CAST
        }

        if (media) {
            publishContent.embeds = media.map(m => ({ url: m.farcaster }))
        }

        publishContent.embeds = publishContent.embeds.concat(this.parseEmbeds(text)).slice(0, 2)

        const { mentions, mentionsPositions, mentionsText } = await this.parseFarcasterMentions(text)
        publishContent.mentions = mentions
        publishContent.mentionsPositions = mentionsPositions
        publishContent.text = mentionsText

        if ((replyTo as { hash: string, fid: string })?.hash) {
            const hash = (replyTo as { hash: string, fid: string }).hash.startsWith('0x') ? (replyTo as { hash: string, fid: string }).hash.slice(2) : (replyTo as { hash: string, fid: string }).hash
            publishContent.parentCastId = {
                fid: Number((replyTo as { hash: string, fid: string }).fid),
                hash: Buffer.from(hash, 'hex')
            }
        } else if (typeof replyTo === 'string') {
            publishContent.parentUrl = String(replyTo)
        }

        const hash = await this.publishCast(publishContent)

        return Buffer.from(hash).toString('hex')
    }

    createCast = async ({
        media = [] as Array<{ farcaster: string }>,
        content = '',
        replyTo = undefined as string | {
            hash: string;
            fid: string;
        } | undefined
    }: {
        media?: {
            farcaster: string;
        }[] | undefined;
        content?: string | undefined;
        replyTo?: string | {
            hash: string;
            fid: string;
        } | undefined
    }): Promise<string> => {
        return await this.createFarcasterPost({
            media,
            content,
            replyTo
        })
    }

    deleteCast = async (hash: string): Promise<boolean> => {
        try {
            if (hash.startsWith('0x')) {
                hash = hash.slice(2)
            }

            const deleteCastMessage = await makeCastRemove({
                targetHash: Buffer.from(hash, 'hex'),
            }, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            if (!deleteCastMessage.isOk()) {
                const hubError = deleteCastMessage._unsafeUnwrapErr().toString()
                console.error(`Failed to delete cast due to network error hash=${hash} fid=${this.FID} err=${hubError}`)
                return false
            }

            this.checkSigner()

            const deleteCastResponse = await this.nodeClient.submitMessage(deleteCastMessage._unsafeUnwrap(), this.nodeClientAuthMetadata)

            if (!deleteCastResponse.isOk()) {
                const hubError = deleteCastResponse._unsafeUnwrapErr().toString()
                console.error(`Failed to delete cast due to network error hash=${hash} fid=${this.FID} err=${hubError}`)
                return false
            }

            return true

        } catch (e) {
            console.error(`Failed to delete cast due to network error hash=${hash} fid=${this.FID} err=${e}`)
            return false
        }
    }

    addReaction = async (hash: string, fid: number, reactionType: ReactionType): Promise<boolean> => {
        try {

            if (hash.startsWith('0x')) {
                hash = hash.slice(2)
            }

            const reactionMessage = await makeReactionAdd({
                targetCastId: {
                    fid,
                    hash: Buffer.from(hash, 'hex')
                },
                type: reactionType
            }, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            this.checkSigner()

            const submitReactionMessage = await this.nodeClient.submitMessage(reactionMessage._unsafeUnwrap(), this.nodeClientAuthMetadata)
            if (!submitReactionMessage.isOk()) {
                const hubError = reactionMessage._unsafeUnwrapErr().toString()
                console.error(`Failed to add reaction due to network error hash=${hash} err=${hubError}`)
                return false
            }

            return true
        } catch (e) {
            console.error(`Failed to add reaction due to network error hash=${hash} err=${e}`)
            return false
        }
    }

    addLink = async (targetFid: number): Promise<boolean> => {
        try {

            this.checkSigner()

            const linkMessage = await makeLinkAdd({
                type: 'follow' as LinkType,
                targetFid,
            }, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            const submitLinkMessage = await this.nodeClient.submitMessage(linkMessage._unsafeUnwrap(), this.nodeClientAuthMetadata)
            if (!submitLinkMessage.isOk()) {
                const hubError = linkMessage._unsafeUnwrapErr().toString()
                console.error(`Failed to add link due to network error fid=${targetFid} err=${hubError}`)
                return false
            }
            return true
        } catch (e) {
            console.error(`Failed to add link due to network error fid=${targetFid} err=${e}`)
            return false
        }
    }

    removeLink = async (targetFid: number): Promise<boolean> => {
        try {
            this.checkSigner()
            const linkMessage = await makeLinkRemove({
                targetFid,
                type: 'follow' as LinkType,
            }, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            const submitLinkMessage = await this.nodeClient.submitMessage(linkMessage._unsafeUnwrap(), this.nodeClientAuthMetadata)
            if (!submitLinkMessage.isOk()) {
                const hubError = linkMessage._unsafeUnwrapErr().toString()
                console.error(`Failed to remove link due to network error fid=${targetFid} err=${hubError}`)
                return false
            }
            return true
        } catch (e) {
            console.error(`Failed to remove link due to network error fid=${targetFid} err=${e}`)
            return false
        }
    }

    removeReaction = async (hash: string, fid: number, reactionType: ReactionType): Promise<boolean> => {
        try {

            if (hash.startsWith('0x')) {
                hash = hash.slice(2)
            }

            const reactionMessage = await makeReactionRemove({
                targetCastId: {
                    fid,
                    hash: Buffer.from(hash, 'hex')
                },
                type: reactionType
            }, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            this.checkSigner()

            const submitReactionMessage = await this.nodeClient.submitMessage(reactionMessage._unsafeUnwrap(), this.nodeClientAuthMetadata)
            if (!submitReactionMessage.isOk()) {
                const hubError = reactionMessage._unsafeUnwrapErr().toString()
                console.error(`Failed to remove reaction due to network error hash=${hash} err=${hubError}`)
                return false
            }

            return true
        } catch (e) {
            console.error(`Failed to remove reaction due to network error hash=${hash} err=${e}`)
            return false
        }
    }

    like = async (hash: string, fid: number): Promise<boolean> => {
        return await this.addReaction(hash, fid, ReactionType.LIKE)
    }

    removeLike = async (hash: string, fid: number): Promise<boolean> => {
        return await this.removeReaction(hash, fid, ReactionType.LIKE)
    }

    follow = async (fid: number): Promise<boolean> => {
        return await this.addLink(fid)
    }

    unfollow = async (fid: number): Promise<boolean> => {
        return await this.removeLink(fid)
    }

    recast = async (hash: string, fid: number): Promise<boolean> => {
        return await this.addReaction(hash, fid, ReactionType.RECAST)
    }

    removeRecast = async (hash: string, fid: number): Promise<boolean> => {
        return await this.removeReaction(hash, fid, ReactionType.RECAST)
    }

    getCastFromHash = async (hash: string, fid: number): Promise<CastAddBody | null> => {
        try {
            const cast = await this.nodeClient.getCast({
                hash: Buffer.from(hash, 'hex'),
                fid: fid
            })
            if (!cast.isOk()) {
                throw new Error(cast._unsafeUnwrapErr().toString())
            }

            const castData = cast._unsafeUnwrap()

            if (castData.data?.castAddBody) {
                return castData.data.castAddBody as CastAddBody;
            }
            return null
        } catch (e) {
            console.error(`Failed to get cast from hash=${hash} err=${e}`)
            return null
        }
    }

    getFidFromUsername = async (username: string): Promise<number | null> => {
        try {
            const user = await this.nodeClient.getUsernameProof({
                name: new TextEncoder().encode(username),
            })
            if (!user.isOk()) {
                throw new Error(user._unsafeUnwrapErr().toString())
            }
            return user._unsafeUnwrap().fid
        } catch (e) {
            console.error(`Failed to get fid from username=${username} err=${e}`)
            return null
        }
    }

    getCastsByFid = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        delayBetweenRequests = 0,
        excludeCastRemoveMessages = true,
        onlyIncludeRemoveMessages = false,
        maximumCastsFetched = 0,
        fetchUntilNoDataLeft = false,
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        delayBetweenRequests?: number,
        excludeCastRemoveMessages?: boolean,
        onlyIncludeRemoveMessages?: boolean,
        maximumCastsFetched?: number
        fetchUntilNoDataLeft?: boolean
    }): Promise<{
        casts: {
            hash: string;
            fid: number | undefined;
            cast: CastAddBody | undefined;
            timestamp: number;
            fullMessageData: MessageData | undefined;
        }[];
    } | null> => {
        try {

            if (itemsPerRequests > 100) {
                itemsPerRequests = 100
                console.warn(`Limit was set to max value of 100`)
            }

            if (toTimestamp && toTimestamp < fromTimestamp) {
                throw new Error('Invalid timestamp range, fromTimestamp must be greater than toTimestamp')
            }

            if (toTimestamp > Date.now()) {
                throw new Error('Invalid fromTimestamp value, must be less or equal to current time')
            }

            if (onlyIncludeRemoveMessages && excludeCastRemoveMessages) {
                throw new Error('Invalid parameters, onlyIncludeRemoveMessages and excludeCastRemoveMessages cannot be true at the same time')
            }

            fromTimestamp = fromTimestamp / 1000
            fromTimestamp = Math.trunc(fromTimestamp - FC_TIMESTMAP_OFFSET)
            toTimestamp = toTimestamp / 1000
            toTimestamp = Math.trunc(toTimestamp - FC_TIMESTMAP_OFFSET)

            if (toTimestamp < 0) {
                toTimestamp = 0
            }
            if (fromTimestamp < 0) {
                fromTimestamp = 0
            }

            let casts = await this.nodeClient.getAllCastMessagesByFid({
                fid,
                reverse: true,
                pageSize: itemsPerRequests,
                startTimestamp: fromTimestamp,
                stopTimestamp: toTimestamp,
            })


            if (!casts.isOk()) {
                throw new Error(casts._unsafeUnwrapErr().toString())
            }

            if (delayBetweenRequests > 0) {
                await wait(delayBetweenRequests)
            }



            const mapCasts = casts._unsafeUnwrap().messages.map((m: Message) => {

                return {
                    hash: Buffer.from(m.hash).toString('hex'),
                    fid: m.data?.fid,
                    cast: m.data?.castAddBody,
                    timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                    fullMessageData: m?.data
                }
            })

            let castPageToken = casts._unsafeUnwrap().nextPageToken

            while (fetchUntilNoDataLeft && castPageToken) {
                castPageToken = casts._unsafeUnwrap().nextPageToken

                if (delayBetweenRequests > 0) {
                    await wait(delayBetweenRequests)
                }

                if (maximumCastsFetched > 0 && mapCasts.length >= maximumCastsFetched) {
                    break
                }

                if (casts._unsafeUnwrap().messages.length === 0) {
                    break
                }

                if (!castPageToken?.length) {
                    break
                }

                casts = await this.nodeClient.getAllCastMessagesByFid({
                    fid,
                    reverse: true,
                    pageSize: itemsPerRequests,
                    startTimestamp: fromTimestamp,
                    stopTimestamp: toTimestamp,
                    pageToken: castPageToken
                })

                if (!casts.isOk()) {
                    throw new Error(casts._unsafeUnwrapErr().toString())
                }

                mapCasts.push(...casts._unsafeUnwrap().messages.map((m: Message) => {
                    return {
                        hash: Buffer.from(m.hash).toString('hex'),
                        fid: m.data?.fid,
                        cast: m.data?.castAddBody,
                        timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                        fullMessageData: m?.data
                    }
                }))

            }

            if (excludeCastRemoveMessages) {
                return {
                    casts: mapCasts.filter((c) => !c?.fullMessageData?.castRemoveBody)
                }
            }

            if (onlyIncludeRemoveMessages) {
                return {
                    casts: mapCasts.filter((c) => c?.fullMessageData?.castRemoveBody)
                }
            }

            return {
                casts: mapCasts
            }

        } catch (e) {
            console.error(`Failed to get latest casts from fid=${fid} err=${e}`)
            return null
        }
    }

    getFidReactions = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        delayBetweenRequests = 0,
        fetchUntilNoDataLeft = false,
        maximumReactionsFetched = 0
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        delayBetweenRequests?: number,
        fetchUntilNoDataLeft?: boolean,
        maximumReactionsFetched?: number
    }): Promise<{
        reactions: {
            hash: string;
            fid: number | undefined;
            reaction: {
                type: ReactionType | undefined;
                targetCastId: CastId | undefined;
                targetUrl: string | undefined;
            };
            timestamp: number;
            fullMessageData: MessageData | undefined;
        }[];
    } | null> => {
        try {

            if (itemsPerRequests > 100) {
                itemsPerRequests = 100
                console.warn(`Limit was set to max value of 100`)
            }

            if (toTimestamp && toTimestamp < fromTimestamp) {
                throw new Error('Invalid timestamp range, toTimestamp must be greater than fromTimestamp')
            }

            if (toTimestamp > Date.now()) {
                throw new Error('Invalid fromTimestamp value, must be less or equal to current time')
            }

            fromTimestamp = fromTimestamp / 1000
            fromTimestamp = Math.trunc(fromTimestamp - FC_TIMESTMAP_OFFSET)
            toTimestamp = toTimestamp / 1000
            toTimestamp = Math.trunc(toTimestamp - FC_TIMESTMAP_OFFSET)

            if (toTimestamp < 0) {
                toTimestamp = 0
            }
            if (fromTimestamp < 0) {
                fromTimestamp = 0
            }

            let reactions = await this.nodeClient.getAllReactionMessagesByFid({
                fid,
                pageSize: itemsPerRequests,
                reverse: true,
                startTimestamp: fromTimestamp,
                stopTimestamp: toTimestamp
            })

            if (!reactions.isOk()) {
                throw new Error(reactions._unsafeUnwrapErr().toString())
            }

            if (delayBetweenRequests > 0) {
                await wait(delayBetweenRequests)
            }

            const mapReactions = reactions._unsafeUnwrap().messages.map((m: Message) => {
                return {
                    hash: Buffer.from(m.hash).toString('hex'),
                    fid: m.data?.fid,
                    reaction: {
                        type: m.data?.reactionBody?.type,
                        targetCastId: m.data?.reactionBody?.targetCastId,
                        targetUrl: m.data?.reactionBody?.targetUrl
                    },
                    timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                    fullMessageData: m?.data
                }
            })

            let reactionPageToken = reactions._unsafeUnwrap().nextPageToken

            while (fetchUntilNoDataLeft && reactionPageToken) {

                reactionPageToken = reactions._unsafeUnwrap().nextPageToken

                if (delayBetweenRequests > 0) {
                    await wait(delayBetweenRequests)
                }

                if (maximumReactionsFetched > 0 && mapReactions.length >= maximumReactionsFetched) {
                    break
                }

                if (reactions._unsafeUnwrap().messages.length === 0) {
                    break
                }

                if (!reactionPageToken?.length) {
                    break
                }

                reactions = await this.nodeClient.getAllReactionMessagesByFid({
                    fid,
                    pageSize: itemsPerRequests,
                    reverse: true,
                    startTimestamp: fromTimestamp,
                    stopTimestamp: toTimestamp,
                    pageToken: reactionPageToken
                })

                if (!reactions.isOk()) {
                    throw new Error(reactions._unsafeUnwrapErr().toString())
                }

                const newReactions = reactions._unsafeUnwrap().messages.map((m: Message) => {
                    return {
                        hash: Buffer.from(m.hash).toString('hex'),
                        fid: m.data?.fid,
                        reaction: {
                            type: m.data?.reactionBody?.type,
                            targetCastId: m.data?.reactionBody?.targetCastId,
                            targetUrl: m.data?.reactionBody?.targetUrl
                        },
                        timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                        fullMessageData: m?.data
                    }
                })

                mapReactions.push(...newReactions)
            }

            return {
                reactions: mapReactions
            }

        } catch (e) {
            console.error(`Failed to get reactions for fid=${fid} err=${e}`)
            return null
        }
    }

    getReationsByFidByType = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        type = ReactionType.LIKE,
        delayBetweenRequests = 0,
        fetchUntilNoDataLeft = false,
        maximumReactionsFetched = 0
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        type?: ReactionType,
        delayBetweenRequests?: number,
        fetchUntilNoDataLeft?: boolean,
        maximumReactionsFetched?: number
    }): Promise<{
        hash: string;
        fid: number | undefined;
        reaction: {
            type: ReactionType | undefined;
            targetCastId: CastId | undefined;
            targetUrl: string | undefined;
        };
        fullMessageData: MessageData | undefined;
        timestamp: number;
    }[]> => {
        let reactions = []
        do {
            const resultReactions = await this.getFidReactions({
                fid,
                itemsPerRequests,
                fromTimestamp,
                toTimestamp,
                delayBetweenRequests,
                fetchUntilNoDataLeft,
                maximumReactionsFetched
            })
            if (!reactions) {
                break
            }
            const likeReactions = resultReactions?.reactions.filter((r) => r.reaction.type === type) || []
            reactions.push(...likeReactions)
            const lastTimestamp = likeReactions[likeReactions.length - 1].timestamp
            if (toTimestamp >= lastTimestamp) {
                break
            }
            fromTimestamp = lastTimestamp

        } while (true)
        return reactions
    }

    getLikesByFid = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        delayBetweenRequests = 0,
        fetchUntilNoDataLeft = false,
        maximumReactionsFetched = 0
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        delayBetweenRequests?: number,
        fetchUntilNoDataLeft?: boolean,
        maximumReactionsFetched?: number
    }): Promise<{
        hash: string;
        fid: number | undefined;
        reaction: {
            type: ReactionType | undefined;
            targetCastId: CastId | undefined;
            targetUrl: string | undefined;
        };
        fullMessageData: MessageData | undefined;
        timestamp: number;
    }[]> => {
        return await this.getReationsByFidByType({
            fid,
            itemsPerRequests,
            fromTimestamp,
            toTimestamp,
            type: ReactionType.LIKE,
            delayBetweenRequests,
            fetchUntilNoDataLeft,
            maximumReactionsFetched
        })
    }

    getRecastsByFid = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        delayBetweenRequests = 0,
        fetchUntilNoDataLeft = false,
        maximumReactionsFetched = 0
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        delayBetweenRequests?: number,
        fetchUntilNoDataLeft?: boolean,
        maximumReactionsFetched?: number
    }): Promise<{
        hash: string;
        fid: number | undefined;
        reaction: {
            type: ReactionType | undefined;
            targetCastId: CastId | undefined;
            targetUrl: string | undefined;
        };
        timestamp: number;
    }[]> => {
        return await this.getReationsByFidByType({
            fid,
            itemsPerRequests,
            fromTimestamp,
            toTimestamp,
            type: ReactionType.RECAST,
            delayBetweenRequests,
            fetchUntilNoDataLeft,
            maximumReactionsFetched
        })
    }

    getFrameBody = async ({
        buttonIndex = 1,
        castHash = '',
        url,
        inputText = '',
        address = '',
        fid,
        state = ''
    }: {
        buttonIndex?: number,
        castHash?: string,
        url: string,
        inputText?: string,
        address?: string,
        fid: number | string
        state?: string
    }): Promise<FrameActionMessage | null> => {
        try {
            castHash = castHash?.replace('0x', '') || ''
            const framePacketData = {
                url: Buffer.from(url, 'utf8'),
                buttonIndex: Number(buttonIndex),
                inputText: Buffer.from(inputText || '', 'utf8'),
                state: Buffer.from(state || '', 'utf8'),
                castId: {
                    fid: Number(fid),
                    hash: Buffer.from(castHash, 'hex')
                },
                address: Buffer.from(address.replace('0x', ''), 'hex'),
                transactionId: Buffer.from('', 'hex')
            }

            const frameBody = await makeFrameAction(framePacketData, {
                fid: this.FID,
                network: FarcasterNetwork.MAINNET
            }, this.signer)

            if (!frameBody.isOk()) {
                throw new Error(frameBody._unsafeUnwrapErr().toString())
            }

            return frameBody._unsafeUnwrap()
        } catch (e) {
            console.error(`Failed to get frame body for url=${url} err=${e}`)
            return null
        }
    }

    getAllLinksByFid = async ({
        fid,
        itemsPerRequests = 10,
        fromTimestamp = 0,
        toTimestamp = Date.now(),
        delayBetweenRequests = 0,
        fetchUntilNoDataLeft = false,
        maximumLinksFetched = 0
    }: {
        fid: number,
        itemsPerRequests?: number,
        fromTimestamp?: number,
        toTimestamp?: number,
        delayBetweenRequests?: number,
        fetchUntilNoDataLeft?: boolean,
        maximumLinksFetched?: number
    }): Promise<{
        links: {
            hash: string;
            fid: number | undefined;
            link: LinkBody | undefined;
            timestamp: number;
            fullMessageData: MessageData | undefined;
        }[];
    } | null> => {
        try {

            if (itemsPerRequests > 100) {
                itemsPerRequests = 100
                console.warn(`Limit was set to max value of 100`)
            }

            if (toTimestamp && toTimestamp < fromTimestamp) {
                throw new Error('Invalid timestamp range, fromTimestamp must be greater than toTimestamp')
            }

            if (toTimestamp > Date.now()) {
                throw new Error('Invalid fromTimestamp value, must be less or equal to current time')
            }

            fromTimestamp = fromTimestamp / 1000
            fromTimestamp = Math.trunc(fromTimestamp - FC_TIMESTMAP_OFFSET)
            toTimestamp = toTimestamp / 1000
            toTimestamp = Math.trunc(toTimestamp - FC_TIMESTMAP_OFFSET)

            if (toTimestamp < 0) {
                toTimestamp = 0
            }
            if (fromTimestamp < 0) {
                fromTimestamp = 0
            }


            let links = await this.nodeClient.getAllLinkMessagesByFid({
                fid,
                pageSize: itemsPerRequests,
                reverse: true,
                startTimestamp: fromTimestamp,
                stopTimestamp: toTimestamp
            })

            if (!links.isOk()) {
                throw new Error(links._unsafeUnwrapErr().toString())
            }

            const mapLinks = links._unsafeUnwrap().messages.map((m: Message) => {
                return {
                    hash: Buffer.from(m.hash).toString('hex'),
                    fid: m.data?.fid,
                    link: m.data?.linkBody,
                    timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                    fullMessageData: m?.data
                }
            })

            let pageToken = links._unsafeUnwrap()?.nextPageToken

            while (pageToken && fetchUntilNoDataLeft) {
                pageToken = links._unsafeUnwrap()?.nextPageToken

                if (maximumLinksFetched > 0 && mapLinks.length >= maximumLinksFetched) {
                    break
                }

                if (delayBetweenRequests > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
                }

                if (links._unsafeUnwrap().messages.length === 0) {
                    break
                }

                if (!pageToken?.length) {
                    break
                }

                links = await this.nodeClient.getAllLinkMessagesByFid({
                    fid,
                    pageSize: itemsPerRequests,
                    reverse: true,
                    startTimestamp: fromTimestamp,
                    stopTimestamp: toTimestamp,
                    pageToken
                })

                if (!links.isOk()) {
                    throw new Error(links._unsafeUnwrapErr().toString())
                }

                mapLinks.push(
                    ...links._unsafeUnwrap().messages.map((m: Message) => {
                        return {
                            hash: Buffer.from(m.hash).toString('hex'),
                            fid: m.data?.fid,
                            link: m.data?.linkBody,
                            timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000,
                            fullMessageData: m?.data
                        }
                    })
                )

            }

            return {
                links: mapLinks
            }

        } catch (e) {
            console.error(`Failed to get links for fid=${fid} err=${e}`)
            return null
        }
    }

    getConnectedAddresses = async ({ fid }: { fid: number }): Promise<{
        hash: string,
        fid: number | undefined,
        verificationType: number | undefined,
        verificationChainId: number | undefined,
        timestamp: number,
    }[] | null> => {
        try {
            const address = await this.nodeClient.getAllVerificationMessagesByFid({
                fid,
                pageSize: 90,
                reverse: true,
            })

            if (!address.isOk()) {
                throw new Error(address._unsafeUnwrapErr().toString())
            }

            return address._unsafeUnwrap().messages.map((m: Message) => {

                let address: string | null = Buffer.from(m.data?.verificationAddAddressBody?.address || []).toString('hex')
                if (address.length !== 40) {
                    address = null
                } else {
                    address = '0x' + address
                }

                return {
                    hash: Buffer.from(m.hash).toString('hex'),
                    fid: m.data?.fid,
                    verificationAddress: '0x' + Buffer.from(m.data?.verificationAddAddressBody?.address || []).toString('hex'),
                    verificationType: m.data?.verificationAddAddressBody?.verificationType,
                    verificationChainId: m.data?.verificationAddAddressBody?.chainId,
                    timestamp: (m.data?.timestamp ?? 0) * 1000 + FC_TIMESTMAP_OFFSET * 1000
                }
            })
        } catch (e) {
            console.error(`Failed to get connected address for fid=${fid} err=${e}`)
            return null
        }
    }

    getNodeInfo = async (): Promise<null | {
        dbStats: {
            approxSize?: number;
            numFidEvents?: number;
            numFnameEvents?: number;
            numMessages?: number;
        } | undefined,
        version: string;
        operatorFid: number;
        isSyncing: boolean;
        nickname: string;
    }> => {
        try {
            const nodeInfo = await this.nodeClient.getInfo({
                dbStats: true,
            })
            if (!nodeInfo.isOk()) {
                return null
            }
            const info = nodeInfo._unsafeUnwrap()

            return {
                dbStats: info.dbStats,
                version: info.version,
                operatorFid: info.hubOperatorFid,
                isSyncing: info.isSyncing,
                nickname: info.nickname,
            }
        } catch (e) {
            console.error(`Failed to get node info err=${e}`)
            return null
        }
    }

}

export { SnapChainClient }
