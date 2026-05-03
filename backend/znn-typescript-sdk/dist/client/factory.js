import { HttpClient } from "./http.js";
import { WsClient } from "./websocket.js";
const newHTTPClient = (url) => {
    return new HttpClient(url);
};
const newWSClient = (url) => {
    // Note: consumer must call initialize on the returned WsClient before using sendRequest
    return new WsClient(url);
};
export const newClient = (url) => {
    const scheme = url.split(":")[0];
    switch (scheme) {
        case "ws":
        case "wss":
            return newWSClient(url);
        case "http":
        case "https":
            return newHTTPClient(url);
        default:
            throw new Error("Unknown URL scheme: " + scheme);
    }
};
//# sourceMappingURL=factory.js.map