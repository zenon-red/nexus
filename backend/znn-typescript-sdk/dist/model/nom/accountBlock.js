import { Buffer } from "buffer";
import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash, EMPTY_HASH, HashHeight, TokenStandard, EMPTY_HASH_HEIGHT, EMPTY_ADDRESS, EMPTY_ZTS } from "../primitives/index.js";
import { Model } from "../base.js";
import { Token } from "./token.js";
import { Zenon } from "../../zenon.js";
import { arrayify } from "../../utilities/bytes.js";
export var BlockTypeEnum;
(function (BlockTypeEnum) {
    BlockTypeEnum[BlockTypeEnum["Unknown"] = 0] = "Unknown";
    BlockTypeEnum[BlockTypeEnum["GenesisReceive"] = 1] = "GenesisReceive";
    BlockTypeEnum[BlockTypeEnum["UserSend"] = 2] = "UserSend";
    BlockTypeEnum[BlockTypeEnum["UserReceive"] = 3] = "UserReceive";
    BlockTypeEnum[BlockTypeEnum["ContractSend"] = 4] = "ContractSend";
    BlockTypeEnum[BlockTypeEnum["ContractReceive"] = 5] = "ContractReceive";
})(BlockTypeEnum || (BlockTypeEnum = {}));
export class AccountBlockTemplate extends Model {
    constructor(options) {
        super();
        this.version = options.version ?? 1;
        this.chainIdentifier = options.chainIdentifier ?? Zenon.getChainIdentifier();
        this.blockType = options.blockType;
        this.hash = options.hash ?? EMPTY_HASH;
        this.previousHash = options.previousHash ?? EMPTY_HASH;
        this.height = options.height ?? 0;
        this.momentumAcknowledged = options.momentumAcknowledged ?? EMPTY_HASH_HEIGHT;
        this.address = options.address ?? EMPTY_ADDRESS;
        this.toAddress = options.toAddress ?? EMPTY_ADDRESS;
        this.amount = options.amount ?? BigNumber.from(0);
        this.tokenStandard = options.tokenStandard ?? EMPTY_ZTS;
        this.fromBlockHash = options.fromBlockHash ?? EMPTY_HASH;
        this.data = options.data ?? Buffer.from([]);
        this.fusedPlasma = options.fusedPlasma ?? 0;
        this.difficulty = options.difficulty ?? 0;
        this.nonce = options.nonce ?? "";
        this.publicKey = options.publicKey ?? Buffer.from([]);
        this.signature = options.signature ?? Buffer.from([]);
    }
    static fromJson(json) {
        return new AccountBlockTemplate({
            version: json.version,
            chainIdentifier: json.chainIdentifier,
            blockType: json.blockType,
            hash: Hash.parse(json.hash),
            previousHash: Hash.parse(json.previousHash),
            height: json.height,
            momentumAcknowledged: HashHeight.fromJson(json.momentumAcknowledged),
            address: Address.parse(json.address),
            toAddress: Address.parse(json.toAddress),
            amount: BigNumber.from(json.amount.toString()),
            tokenStandard: TokenStandard.parse(json.tokenStandard),
            fromBlockHash: Hash.parse(json.fromBlockHash),
            data: json.data === null || json.data === ""
                ? Buffer.from([])
                : Buffer.from(json.data, "base64"),
            fusedPlasma: json.fusedPlasma,
            difficulty: json.difficulty,
            nonce: json.nonce,
            publicKey: json.publicKey ? Buffer.from(json.publicKey) : Buffer.from([]),
            signature: json.signature ? Buffer.from(json.signature) : Buffer.from([])
        });
    }
    toJson() {
        return {
            version: this.version,
            chainIdentifier: this.chainIdentifier,
            blockType: this.blockType,
            hash: this.hash.toString(),
            previousHash: this.previousHash.toString(),
            height: this.height,
            momentumAcknowledged: this.momentumAcknowledged.toJson(),
            address: this.address.toString(),
            toAddress: this.toAddress.toString(),
            amount: this.amount.toString(),
            tokenStandard: this.tokenStandard.toString(),
            fromBlockHash: this.fromBlockHash.toString(),
            data: this.data.toString("base64"),
            fusedPlasma: this.fusedPlasma,
            difficulty: this.difficulty,
            nonce: this.nonce,
            publicKey: this.publicKey.toString("base64"),
            signature: this.signature.toString("base64"),
        };
    }
    static receive(fromBlockHash) {
        return new AccountBlockTemplate({
            blockType: BlockTypeEnum.UserReceive,
            fromBlockHash: fromBlockHash
        });
    }
    static send(toAddress, tokenStandard, amount) {
        return new AccountBlockTemplate({
            blockType: BlockTypeEnum.UserSend,
            toAddress: toAddress,
            amount: amount,
            tokenStandard: tokenStandard
        });
    }
    static callContract(address, tokenStandard, amount, data) {
        if (typeof data === "string") {
            data = Buffer.from(arrayify(data));
        }
        return new AccountBlockTemplate({
            blockType: BlockTypeEnum.UserSend,
            toAddress: address,
            amount: amount,
            tokenStandard: tokenStandard,
            data: data
        });
    }
}
export class AccountBlockConfirmationDetail extends Model {
    constructor(numConfirmations, momentumHeight, momentumHash, momentumTimestamp) {
        super();
        this.numConfirmations = numConfirmations;
        this.momentumHeight = momentumHeight;
        this.momentumHash = momentumHash;
        this.momentumTimestamp = momentumTimestamp;
    }
    static fromJson(json) {
        return new AccountBlockConfirmationDetail(json.numConfirmations, json.momentumHeight, Hash.parse(json.momentumHash), json.momentumTimestamp);
    }
}
export class AccountBlock extends AccountBlockTemplate {
    constructor(options) {
        super(options);
        this.token = options.token;
        this.descendantBlocks = options.descendantBlocks ?? [];
        this.basePlasma = options.basePlasma ?? 0;
        this.usedPlasma = options.usedPlasma ?? 0;
        this.changesHash = options.changesHash ?? EMPTY_HASH;
        this.confirmationDetail = options.confirmationDetail;
        this.pairedAccountBlock = options.pairedAccountBlock;
    }
    static fromJson(json) {
        return new AccountBlock({
            version: json.version,
            chainIdentifier: json.chainIdentifier,
            blockType: json.blockType,
            hash: Hash.parse(json.hash),
            previousHash: Hash.parse(json.previousHash),
            height: json.height,
            momentumAcknowledged: HashHeight.fromJson(json.momentumAcknowledged),
            address: Address.parse(json.address),
            toAddress: Address.parse(json.toAddress),
            amount: BigNumber.from(json.amount.toString()),
            tokenStandard: TokenStandard.parse(json.tokenStandard),
            fromBlockHash: Hash.parse(json.fromBlockHash),
            data: json.data === null || json.data === ""
                ? Buffer.from([])
                : Buffer.from(json.data, "base64"),
            fusedPlasma: json.fusedPlasma,
            difficulty: json.difficulty,
            nonce: json.nonce,
            publicKey: json.publicKey ? Buffer.from(json.publicKey) : Buffer.from([]),
            signature: json.signature ? Buffer.from(json.signature) : Buffer.from([]),
            token: json.token ? Token.fromJson(json.token) : undefined,
            descendantBlocks: json.descendantBlocks
                ? json.descendantBlocks.map((block) => AccountBlock.fromJson(block))
                : undefined,
            basePlasma: json.basePlasma,
            usedPlasma: json.usedPlasma,
            changesHash: json.changesHash ? Hash.parse(json.changesHash) : undefined,
            confirmationDetail: json.confirmationDetail ? AccountBlockConfirmationDetail.fromJson(json.confirmationDetail) : undefined,
            pairedAccountBlock: json.pairedAccountBlock ? AccountBlock.fromJson(json.pairedAccountBlock) : undefined
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            token: this.token?.toJson(),
            descendantBlocks: this.descendantBlocks.map((block) => block.toJson()),
            basePlasma: this.basePlasma,
            usedPlasma: this.usedPlasma,
            changesHash: this.changesHash.toString(),
            confirmationDetail: this.confirmationDetail?.toJson(),
            pairedAccountBlock: this.pairedAccountBlock?.toJson(),
        };
    }
    isCompleted() {
        return this.confirmationDetail != null;
    }
}
export class AccountBlockList extends Model {
    constructor(count = 0, list = [], more = false) {
        super();
        this.count = count;
        this.list = list;
        this.more = more;
    }
    static fromJson(json) {
        return new AccountBlockList(json.count, json.list.map(AccountBlock.fromJson), json.more);
    }
}
//# sourceMappingURL=accountBlock.js.map