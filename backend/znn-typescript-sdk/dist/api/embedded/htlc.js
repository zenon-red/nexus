import { Api } from "../base.js";
import { HTLC_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { HtlcInfo } from "../../model/embedded/htlc.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Htlc as HtlcContract } from "../../embedded/index.js";
export class HtlcApi extends Api {
    //
    // RPC
    async getById(id) {
        const response = await this.client.sendRequest("embedded.htlc.getById", [
            id.toString()
        ]);
        return HtlcInfo.fromJson(response);
    }
    async getProxyUnlockStatus(address) {
        return await this.client.sendRequest("embedded.htlc.getProxyUnlockStatus", [
            address.toString()
        ]);
    }
    //
    // Contract methods
    create(token, amount, hashLocked, expirationTime, hashType, keyMaxSize, hashLock) {
        return AccountBlockTemplate.callContract(HTLC_ADDRESS, token, amount, HtlcContract.abi.encodeFunctionData("Create", [
            hashLocked.toString(),
            expirationTime,
            hashType,
            keyMaxSize,
            hashLock
        ]));
    }
    reclaim(id) {
        return AccountBlockTemplate.callContract(HTLC_ADDRESS, ZNN_ZTS, BigNumber.from(0), HtlcContract.abi.encodeFunctionData("Reclaim", [
            id.getBytes()
        ]));
    }
    unlock(id, preimage) {
        return AccountBlockTemplate.callContract(HTLC_ADDRESS, ZNN_ZTS, BigNumber.from(0), HtlcContract.abi.encodeFunctionData("Unlock", [
            id.getBytes(),
            preimage
        ]));
    }
    denyProxyUnlock() {
        return AccountBlockTemplate.callContract(HTLC_ADDRESS, ZNN_ZTS, BigNumber.from(0), HtlcContract.abi.encodeFunctionData("DenyProxyUnlock", []));
    }
    allowProxyUnlock() {
        return AccountBlockTemplate.callContract(HTLC_ADDRESS, ZNN_ZTS, BigNumber.from(0), HtlcContract.abi.encodeFunctionData("AllowProxyUnlock", []));
    }
}
//# sourceMappingURL=htlc.js.map