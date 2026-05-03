import { HTTPTransport, Client as OpenRpcClient, RequestManager } from "@open-rpc/client-js";
import { ZnnClientException } from "./errors.js";
export class HttpClient {
    constructor(url) {
        this.url = url;
        this._client = new OpenRpcClient(new RequestManager([new HTTPTransport(url)]));
    }
    async sendRequest(method, parameters = []) {
        try {
            return await this._client.request({ method, params: parameters });
        }
        catch (error) {
            // Extract error details from the JSON-RPC error
            const code = error?.code ?? -1;
            const message = error?.message || error?.toString() || "Unknown error occurred";
            const data = error?.data;
            throw new ZnnClientException(message, code, method, parameters, data);
        }
    }
}
//# sourceMappingURL=http.js.map