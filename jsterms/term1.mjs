
export let metadata = {
	id: "111111",
	name: "term1",

	readme: "term1 readme"
};

export let env = {
	rule: ["r0", "r1", "r2"],
	event: ["e0", "e1", "e2"],
	state: ["s0", "s1", "s2"],
	action: ["a0", "a1", "a2"],
	asset: []
};
export let text = "term1 text";
export let code = {
	e0: function () {
		console.log("enter e0");
		state = "s0";
	},
	e1: function () {
		console.log("enter e1");
		state = "s1";
		console.log("%o", this);
		//this.a1("r0");
		a1("r0");
		//a3("r1"); // ReferenceError: a3 is not defined
	},
	e2: function () {
		var ret;
		switch (state) {
			case "s0":
				state = "s1";
				a0("r0");
				a2("r1");
				break;
			case "s1":
				state = "s2";
				a1("r0");
				a0("r1");
				break;
			case "s2":
				state = "s0";
				a0("r0");
				a1("r1");
				break;
		}
		return ret;
	},
	a3: function (rule) {
		console.log(rule + ": action a3.");
	}
};
export let state = "s0";

export function a0(rule) {
	console.log(rule + state + ": action a0.");
};
export function a1(rule) {
	console.log(rule + state + ": action a1.");
};
export function a2(rule) {
	console.log(rule + state + ": action a2.");
};
