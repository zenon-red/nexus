import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class Spork extends Model {
    constructor(id, name, description, activated, enforcementHeight) {
        super();
        this.id = id;
        this.name = name;
        this.description = description;
        this.activated = activated;
        this.enforcementHeight = enforcementHeight;
    }
    static fromJson(json) {
        return new Spork(Hash.parse(json.id), json.name, json.description, json.activated, json.enforcementHeight);
    }
}
export class SporkList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new SporkList(json.count, json.list.map(Spork.fromJson));
    }
}
//# sourceMappingURL=spork.js.map