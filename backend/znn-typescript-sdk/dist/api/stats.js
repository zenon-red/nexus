import { ExtraData, NetworkInfo, OsInfo, ProcessInfo, SyncInfo } from "../model/stats.js";
import { Api } from "./base.js";
export class StatsApi extends Api {
    async osInfo() {
        const response = await this.client.sendRequest("stats.osInfo", []);
        return OsInfo.fromJson(response);
    }
    async processInfo() {
        const response = await this.client.sendRequest("stats.processInfo", []);
        return ProcessInfo.fromJson(response);
    }
    async networkInfo() {
        const response = await this.client.sendRequest("stats.networkInfo", []);
        return NetworkInfo.fromJson(response);
    }
    async syncInfo() {
        const response = await this.client.sendRequest("stats.syncInfo", []);
        return SyncInfo.fromJson(response);
    }
    async extraData() {
        const response = await this.client.sendRequest("stats.extraData", []);
        const parsed = JSON.parse(response.toString());
        return ExtraData.fromJson(parsed);
    }
}
//# sourceMappingURL=stats.js.map