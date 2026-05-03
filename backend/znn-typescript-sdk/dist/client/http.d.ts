import { Client as ClientInterface } from "./interfaces.js";
export declare class HttpClient implements ClientInterface {
    private url;
    private _client;
    constructor(url: string);
    sendRequest(method: string, parameters?: any[]): Promise<any>;
}
//# sourceMappingURL=http.d.ts.map