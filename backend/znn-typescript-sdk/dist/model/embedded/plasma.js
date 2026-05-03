import { Buffer } from "buffer";
import { BigNumber } from "../../utilities/bignumber.js";
import { BlockTypeEnum } from "../nom/accountBlock.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class PlasmaInfo extends Model {
    constructor(currentPlasma, maxPlasma, qsrAmount) {
        super();
        this.currentPlasma = currentPlasma;
        this.maxPlasma = maxPlasma;
        this.qsrAmount = qsrAmount;
    }
    static fromJson(json) {
        return new PlasmaInfo(json.currentPlasma, json.maxPlasma, BigNumber.from(json.qsrAmount.toString()));
    }
}
export class FusionEntryList extends Model {
    constructor(qsrAmount = BigNumber.from(0), count = 0, list = []) {
        super();
        this.qsrAmount = qsrAmount;
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new FusionEntryList(BigNumber.from(json.qsrAmount.toString()), json.count, json.list.map(FusionEntry.fromJson));
    }
}
export class FusionEntry extends Model {
    constructor(qsrAmount, beneficiary, expirationHeight, id, isRevocable) {
        super();
        this.qsrAmount = qsrAmount;
        this.beneficiary = beneficiary;
        this.expirationHeight = expirationHeight;
        this.id = id;
        this.isRevocable = isRevocable;
    }
    static fromJson(json) {
        return new FusionEntry(BigNumber.from(json.qsrAmount.toString()), Address.parse(json.beneficiary), json.expirationHeight, Hash.parse(json.id), json.isRevocable);
    }
}
export class GetRequiredPowParam extends Model {
    constructor(address, blockType, toAddress = undefined, data = undefined) {
        super();
        this.address = address;
        this.blockType = blockType;
        this.toAddress = toAddress;
        this.data = data;
        if (blockType == BlockTypeEnum.UserReceive) {
            this.toAddress = address;
        }
        else {
            this.toAddress = toAddress;
        }
    }
    static fromJson(json) {
        return new GetRequiredPowParam(Address.parse(json.address), json.blockType, json.toAddress !== undefined ? Address.parse(json.toAddress) : undefined, json.data !== undefined ? Buffer.from(json.data, "hex") : undefined);
    }
}
export class GetRequiredPowResponse extends Model {
    constructor(availablePlasma, basePlasma, requiredDifficulty) {
        super();
        this.availablePlasma = availablePlasma;
        this.basePlasma = basePlasma;
        this.requiredDifficulty = requiredDifficulty;
    }
    static fromJson(json) {
        return new GetRequiredPowResponse(json.availablePlasma, json.basePlasma, json.requiredDifficulty);
    }
}
//# sourceMappingURL=plasma.js.map