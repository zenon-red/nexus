import { ExtraData, NetworkInfo, OsInfo, ProcessInfo, SyncInfo } from "../model/stats.js";
import { Api } from "./base.js";
export declare class StatsApi extends Api {
    osInfo(): Promise<OsInfo>;
    processInfo(): Promise<ProcessInfo>;
    networkInfo(): Promise<NetworkInfo>;
    syncInfo(): Promise<SyncInfo>;
    extraData(): Promise<ExtraData>;
}
//# sourceMappingURL=stats.d.ts.map