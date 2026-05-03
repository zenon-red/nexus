import { Client as ClientInterface } from "./interfaces.js";
declare enum WebsocketStatus {
    Uninitialized = 0,
    Connecting = 1,
    Running = 2,
    Stopped = 3
}
export interface WsClientOptions {
    autoconnect?: boolean;
    reconnect?: boolean;
    reconnect_interval?: number;
    max_reconnects?: number;
}
type WSSubscriptionCallback = (data: any[]) => void;
declare class WSSubscriptions {
    callbacks: Map<string, WSSubscriptionCallback>;
    constructor();
    setCallback(id: string, callback: WSSubscriptionCallback): void;
    handleGlobalNotification(data: any): void;
    newUpdateStream(jsonResponse: string): WSUpdateStream;
}
export declare class WSUpdateStream {
    id: string;
    wsSubscribers: WSSubscriptions;
    constructor(id: string, wsSubscribers: WSSubscriptions);
    onNotification(callback: WSSubscriptionCallback): void;
}
export declare class WsClient implements ClientInterface {
    _wsRpc2Client?: any;
    _websocketIntendedState: WebsocketStatus;
    url: string;
    subscriptions: WSSubscriptions;
    constructor(url: string);
    initialize(url: string, timeout?: number, options?: WsClientOptions): Promise<void>;
    newSubscription(id: string): WSUpdateStream;
    status(): WebsocketStatus;
    restart(options?: WsClientOptions): Promise<void>;
    stop(): void;
    sendRequest(method: string, parameters?: any[]): Promise<any>;
}
export {};
//# sourceMappingURL=websocket.d.ts.map