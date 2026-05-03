import { Api } from "../base.js";
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
export class EmbeddedApi extends Api {
    constructor(accelerator = new AcceleratorApi(), bridge = new BridgeApi(), htlc = new HtlcApi(), liquidity = new LiquidityApi(), pillar = new PillarApi(), plasma = new PlasmaApi(), sentinel = new SentinelApi(), spork = new SporkApi(), stake = new StakeApi(), swap = new SwapApi(), token = new TokenApi()) {
        super();
        this.accelerator = accelerator;
        this.bridge = bridge;
        this.htlc = htlc;
        this.liquidity = liquidity;
        this.pillar = pillar;
        this.plasma = plasma;
        this.sentinel = sentinel;
        this.spork = spork;
        this.stake = stake;
        this.swap = swap;
        this.token = token;
    }
    setClient(client) {
        this.client = client;
        this.accelerator.setClient(client);
        this.bridge.setClient(client);
        this.htlc.setClient(client);
        this.liquidity.setClient(client);
        this.pillar.setClient(client);
        this.plasma.setClient(client);
        this.sentinel.setClient(client);
        this.spork.setClient(client);
        this.stake.setClient(client);
        this.swap.setClient(client);
        this.token.setClient(client);
    }
}
//# sourceMappingURL=embedded.js.map