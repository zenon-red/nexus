export function isBrowser() {
    return typeof window !== "undefined"
        && typeof window.document !== "undefined"
        && typeof navigator !== "undefined";
}
export function isNode() {
    return typeof process !== "undefined"
        && typeof process.versions !== "undefined"
        && typeof process.versions.node !== "undefined";
}
//# sourceMappingURL=global.js.map