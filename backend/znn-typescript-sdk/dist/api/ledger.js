import { MEMORY_POOL_PAGE_SIZE, RPC_MAX_PAGE_SIZE } from "../zenon.js";
import { AccountInfo, AccountBlock, AccountBlockList, Momentum, MomentumList, DetailedMomentumList } from "../model/nom/index.js";
import { Api } from "./base.js";
import { Logger } from "../utilities/logger.js";
const logger = Logger.globalLogger();
export class LedgerApi extends Api {
    async publishRawTransaction(accountBlockTemplate) {
        const response = await this.client.sendRequest("ledger.publishRawTransaction", [
            accountBlockTemplate.toJson()
        ]);
        if (response !== null) {
            logger.throwError(`Error publishing transaction: ${response}`, Logger.errors.NETWORK_ERROR);
        }
        logger.info(`Published account-block: hash=${accountBlockTemplate.hash.toString()}`);
        return accountBlockTemplate;
    }
    //
    // Account Blocks
    async getUnconfirmedBlocksByAddress(address, pageIndex = 0, pageSize = MEMORY_POOL_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("ledger.getUnconfirmedBlocksByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }
    async getUnreceivedBlocksByAddress(address, pageIndex = 0, pageSize = MEMORY_POOL_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("ledger.getUnreceivedBlocksByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }
    async getFrontierAccountBlock(address) {
        const response = await this.client.sendRequest("ledger.getFrontierAccountBlock", [
            address.toString()
        ]);
        return response == null ? null : AccountBlock.fromJson(response);
    }
    async getAccountBlockByHash(hash) {
        const response = await this.client.sendRequest("ledger.getAccountBlockByHash", [
            hash.toString()
        ]);
        return response == null ? null : AccountBlock.fromJson(response);
    }
    async getAccountBlocksByHeight(address, height = 1, count = RPC_MAX_PAGE_SIZE) {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");
        const response = await this.client.sendRequest("ledger.getAccountBlocksByHeight", [
            address.toString(),
            height,
            count,
        ]);
        return AccountBlockList.fromJson(response);
    }
    async getAccountBlocksByPage(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("ledger.getAccountBlocksByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return AccountBlockList.fromJson(response);
    }
    //
    // Account Info
    async getAccountInfoByAddress(address) {
        const response = await this.client.sendRequest("ledger.getAccountInfoByAddress", [
            address.toString()
        ]);
        return response == null ? null : AccountInfo.fromJson(response);
    }
    //
    // Momentums
    async getFrontierMomentum() {
        const response = await this.client.sendRequest("ledger.getFrontierMomentum", []);
        return Momentum.fromJson(response);
    }
    async getMomentumBeforeTime(time) {
        const response = await this.client.sendRequest("ledger.getMomentumBeforeTime", [
            time
        ]);
        return response == null ? null : Momentum.fromJson(response);
    }
    async getMomentumByHash(hash) {
        const response = await this.client.sendRequest("ledger.getMomentumByHash", [
            hash.toString()
        ]);
        return response == null ? null : Momentum.fromJson(response);
    }
    async getMomentumsByHeight(height, count = RPC_MAX_PAGE_SIZE) {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");
        const response = await this.client.sendRequest("ledger.getMomentumsByHeight", [
            height,
            count
        ]);
        return MomentumList.fromJson(response);
    }
    async getMomentumsByPage(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("ledger.getMomentumsByPage", [
            pageIndex,
            pageSize
        ]);
        return MomentumList.fromJson(response);
    }
    async getDetailedMomentumsByHeight(height = 1, count = RPC_MAX_PAGE_SIZE) {
        this.validateMin(height, 1, "height");
        this.validateMax(count, RPC_MAX_PAGE_SIZE, "count");
        const response = await this.client.sendRequest("ledger.getDetailedMomentumsByHeight", [
            height,
            count
        ]);
        return response == null ? null : DetailedMomentumList.fromJson(response);
    }
}
//# sourceMappingURL=ledger.js.map