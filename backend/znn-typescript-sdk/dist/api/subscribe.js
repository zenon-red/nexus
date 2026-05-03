import { Api } from "./base.js";
export class SubscribeApi extends Api {
    async subscribeTo(params) {
        const response = await this.client.sendRequest("ledger.subscribe", params);
        return this.client.newSubscription(response);
    }
    toMomentums() {
        return this.subscribeTo(["momentums"]);
    }
    toAllAccountBlocks() {
        return this.subscribeTo(["allAccountBlocks"]);
    }
    ;
    toAccountBlocksByAddress(address) {
        return this.subscribeTo(["accountBlocksByAddress", address.toString()]);
    }
    ;
    toUnreceivedAccountBlocksByAddress(address) {
        return this.subscribeTo(["unreceivedAccountBlocksByAddress", address.toString()]);
    }
    ;
}
//# sourceMappingURL=subscribe.js.map