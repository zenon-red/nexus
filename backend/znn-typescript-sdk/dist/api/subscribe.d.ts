import { WSUpdateStream, WsClient } from "../client/websocket.js";
import { Address } from "../model/primitives/address.js";
import { Api } from "./base.js";
export declare class SubscribeApi extends Api<WsClient> {
    subscribeTo(params: any): Promise<WSUpdateStream>;
    toMomentums(): Promise<WSUpdateStream>;
    toAllAccountBlocks(): Promise<WSUpdateStream>;
    toAccountBlocksByAddress(address: Address): Promise<WSUpdateStream>;
    toUnreceivedAccountBlocksByAddress(address: Address): Promise<WSUpdateStream>;
}
//# sourceMappingURL=subscribe.d.ts.map