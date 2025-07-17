export let metadata = {
	id: "222222",
	name: "term2",
	readme: "term2 readme"
}
export let text = "term2 text";
export let env = {
	rule: ["r10", "r11"],
	event: ["e10", "e11"],
	state: ["s10", "s1"],
	action: ["a10", "a11"],
	asset: []
};
export let state = "s10";
export let code = {
	state: "s10",
	e11: function () {
		this.state = "s10";
		a10("r10");
	},
	e10: function () {
		var ret;
		switch (this.state) {
			case "s10":
				this.state = "s11";
				a11("r10");
				break;
			case "s11":
				this.state = "s10";
				a10("r10");
				a11("r11");
				break;
		}
		return ret;
	}
}

export function a10(rule) {
	console.log(rule + state + ": action a0.");
}
export function a11(rule) {
	console.log(rule + state + ": action a1.");
}