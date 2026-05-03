import { AccountBlockTemplate } from "../model/nom/accountBlock.js";
import { Hash } from "../model/primitives/index.js";
import { KeyPair } from "../wallet/keyPair.js";
import { Zenon } from "../zenon.js";
export declare function isSendBlock(blockType?: number): boolean;
export declare function isReceiveBlock(blockType: number): boolean;
export declare function getTxHash(transaction: AccountBlockTemplate): Hash;
export declare function send(zenonInstance: Zenon, transaction: AccountBlockTemplate, currentKeyPair: KeyPair): Promise<AccountBlockTemplate>;
//# sourceMappingURL=block.d.ts.map