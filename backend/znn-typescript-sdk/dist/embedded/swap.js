import { EmbeddedContract } from "./embeddedContract.js";
export class Swap extends EmbeddedContract {
}
Swap.definition = `
	[
		{"type":"function","name":"RetrieveAssets", "inputs":[
		    {"name":"publicKey","type":"string"},
		    {"name":"signature","type":"string"}
		]},

		{"type":"variable","name":"swapEntry", "inputs":[
			{"name":"znn","type":"uint256"},
			{"name":"qsr","type":"uint256"}
		]}
	]`;
//# sourceMappingURL=swap.js.map