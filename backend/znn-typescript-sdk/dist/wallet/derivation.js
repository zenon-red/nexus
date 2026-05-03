var _a;
export class Derivation {
    static getDerivationAccount(account = 0) {
        return _a.derivationPath + `/${account}'`;
    }
}
_a = Derivation;
Derivation.coinType = "73404";
Derivation.derivationPath = `m/44'/${_a.coinType}'`;
//# sourceMappingURL=derivation.js.map