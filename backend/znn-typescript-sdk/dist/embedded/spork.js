import { EmbeddedContract } from "./embeddedContract.js";
export class Spork extends EmbeddedContract {
}
Spork.definition = `
	[
		{"type":"function","name":"CreateSpork","inputs":[
		    {"name":"name","type":"string"},
		    {"name":"description","type":"string"}
		]},
		{"type":"function","name":"ActivateSpork","inputs":[
		    {"name":"id","type":"hash"}
		]},

		{"type":"variable", "name":"sporkInfo", "inputs":[
			{"name":"id", "type":"hash"},
			{"name":"name", "type":"string"},
			{"name":"description", "type":"string"},
			{"name":"activated", "type": "bool"},
			{"name":"enforcementHeight", "type": "uint64"}
		]}
	]`;
//# sourceMappingURL=spork.js.map