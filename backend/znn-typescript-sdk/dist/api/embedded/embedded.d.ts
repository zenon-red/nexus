import { Api } from "../base.js";
import { Client } from "../../client/interfaces.js";
import { AcceleratorApi } from "./accelerator.js";
import { BridgeApi } from "./bridge.js";
import { HtlcApi } from "./htlc.js";
import { LiquidityApi } from "./liquidity.js";
import { PillarApi } from "./pillar.js";
import { PlasmaApi } from "./plasma.js";
import { SentinelApi } from "./sentinel.js";
import { SporkApi } from "./spork.js";
import { StakeApi } from "./stake.js";
import { SwapApi } from "./swap.js";
import { TokenApi } from "./token.js";
export declare class EmbeddedApi extends Api {
    accelerator: AcceleratorApi;
    bridge: BridgeApi;
    htlc: HtlcApi;
    liquidity: LiquidityApi;
    pillar: PillarApi;
    plasma: PlasmaApi;
    sentinel: SentinelApi;
    spork: SporkApi;
    stake: StakeApi;
    swap: SwapApi;
    token: TokenApi;
    constructor(accelerator?: AcceleratorApi, bridge?: BridgeApi, htlc?: HtlcApi, liquidity?: LiquidityApi, pillar?: PillarApi, plasma?: PlasmaApi, sentinel?: SentinelApi, spork?: SporkApi, stake?: StakeApi, swap?: SwapApi, token?: TokenApi);
    setClient(client: Client): void;
}
//# sourceMappingURL=embedded.d.ts.map