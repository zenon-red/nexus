import { BigNumber } from "../../utilities/bignumber.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { Api } from "../base.js";
import { Plasma } from "../../embedded/plasma.js";
import { FusionEntryList, GetRequiredPowResponse, PlasmaInfo } from "../../model/embedded/plasma.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { PLASMA_ADDRESS, QSR_ZTS } from "../../model/primitives/index.js";
export class PlasmaApi extends Api {
    //
    // RPC
    async get(address) {
        const response = await this.client.sendRequest("embedded.plasma.get", [
            address.toString()
        ]);
        return PlasmaInfo.fromJson(response);
    }
    async getEntriesByAddress(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.plasma.getEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return FusionEntryList.fromJson(response);
    }
    // Method does not exist in go-zenon but is listed in the dart SDK
    // @see https://github.com/zenon-network/go-zenon/blob/master/rpc/api/embedded/plasma.go
    // @see https://github.com/zenon-network/znn_sdk_dart/blob/master/lib/src/api/embedded/plasma.dart
    // async getRequiredFusionAmount(requiredPlasma: BigNumber): Promise<BigNumber> {
    //     const response = await this.client.sendRequest("embedded.plasma.getRequiredFusionAmount", [
    //         requiredPlasma
    //     ]);
    //
    //     return BigNumber.from(response.toString());
    // }
    async getRequiredPoWForAccountBlock(powParam) {
        const response = await this.client.sendRequest("embedded.plasma.getRequiredPoWForAccountBlock", [
            powParam.toJson(),
        ]);
        return GetRequiredPowResponse.fromJson(response);
    }
    //
    // Contract methods
    fuse(beneficiary, amount) {
        return AccountBlockTemplate.callContract(PLASMA_ADDRESS, QSR_ZTS, amount, Plasma.abi.encodeFunctionData("Fuse", [
            beneficiary.toString()
        ]));
    }
    cancel(id) {
        return AccountBlockTemplate.callContract(PLASMA_ADDRESS, QSR_ZTS, BigNumber.from(0), Plasma.abi.encodeFunctionData("CancelFuse", [
            id.getBytes()
        ]));
    }
}
//# sourceMappingURL=plasma.js.map