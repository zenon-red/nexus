import { Buffer } from "buffer";
import { BigNumberish } from "../../utilities/bignumber.js";
import { Address, Hash, HashHeight, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { Token } from "./token.js";
export declare enum BlockTypeEnum {
    Unknown = 0,
    GenesisReceive = 1,
    UserSend = 2,
    UserReceive = 3,
    ContractSend = 4,
    ContractReceive = 5
}
export interface AccountBlockTemplateOptions {
    version?: number;
    chainIdentifier?: number;
    blockType: number;
    hash?: Hash;
    previousHash?: Hash;
    height?: number;
    momentumAcknowledged?: HashHeight;
    address?: Address;
    toAddress?: Address;
    amount?: BigNumberish;
    tokenStandard?: TokenStandard;
    fromBlockHash?: Hash;
    data?: Buffer;
    fusedPlasma?: number;
    difficulty?: number;
    nonce?: string;
    publicKey?: Buffer;
    signature?: Buffer;
}
interface AccountBlockOptions extends AccountBlockTemplateOptions {
    token?: Token;
    descendantBlocks?: Array<AccountBlock>;
    basePlasma?: number;
    usedPlasma?: number;
    changesHash?: Hash;
    confirmationDetail?: AccountBlockConfirmationDetail;
    pairedAccountBlock?: AccountBlock;
}
export declare class AccountBlockTemplate extends Model {
    version: number;
    chainIdentifier: number;
    blockType: number;
    hash: Hash;
    previousHash: Hash;
    height: number;
    momentumAcknowledged: HashHeight;
    address: Address;
    toAddress: Address;
    amount: BigNumberish;
    tokenStandard: TokenStandard;
    fromBlockHash: Hash;
    data: Buffer;
    fusedPlasma: number;
    difficulty: number;
    nonce: string;
    publicKey: Buffer;
    signature: Buffer;
    constructor(options: AccountBlockTemplateOptions);
    static fromJson(json: {
        [key: string]: any;
    }): AccountBlockTemplate;
    toJson(): {
        [key: string]: any;
    };
    static receive(fromBlockHash: Hash): AccountBlockTemplate;
    static send(toAddress: Address, tokenStandard: TokenStandard, amount: BigNumberish): AccountBlockTemplate;
    static callContract(address: Address, tokenStandard: TokenStandard, amount: BigNumberish, data: Buffer | string): AccountBlockTemplate;
}
export declare class AccountBlockConfirmationDetail extends Model {
    numConfirmations: number;
    momentumHeight: number;
    momentumHash: Hash;
    momentumTimestamp: number;
    constructor(numConfirmations: number, momentumHeight: number, momentumHash: Hash, momentumTimestamp: number);
    static fromJson(json: {
        [key: string]: any;
    }): AccountBlockConfirmationDetail;
}
export declare class AccountBlock extends AccountBlockTemplate {
    token?: Token;
    descendantBlocks: Array<AccountBlock>;
    basePlasma: number;
    usedPlasma: number;
    changesHash: Hash;
    confirmationDetail?: AccountBlockConfirmationDetail;
    pairedAccountBlock?: AccountBlock;
    constructor(options: AccountBlockOptions);
    static fromJson(json: {
        [key: string]: any;
    }): AccountBlock;
    toJson(): {
        [key: string]: any;
    };
    isCompleted(): boolean;
}
export declare class AccountBlockList extends Model {
    count: number;
    list: Array<AccountBlock>;
    more: boolean;
    constructor(count?: number, list?: Array<AccountBlock>, more?: boolean);
    static fromJson(json: {
        [key: string]: any;
    }): AccountBlockList;
}
export {};
//# sourceMappingURL=accountBlock.d.ts.map