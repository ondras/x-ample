const AsyncGeneratorFunction = (async function*() {}).constructor;

let connectedXamples = new Set();

export default class ExAmple extends HTMLElement {
	#mode = "run";
	#code = "";
	#generator;
	#done = false;
	#pulling = false;

	get #output() { return this.shadowRoot.querySelector("[part=output]");}
	get #pre() { return this.shadowRoot.querySelector("[part=code]");}
	get #textarea() { return this.shadowRoot.querySelector("[part=textarea]");}

	static fromScript(scriptNode) {
		let example = new this();
		example.code = scriptNode.textContent.trim();
		return example;
	}

	constructor() {
		super();
		this.attachShadow({mode:"open"});
	}

	get mode() { return this.#mode; }
	set mode(mode) {
		this.#mode = mode;
		let pre = this.#pre;
		let textarea = this.#textarea;
		let code = this.#code;

		switch (mode) {
			case "edit":
				textarea.style.height = `${pre.offsetHeight}px`;
				pre.hidden = true;
				textarea.hidden = false;
				textarea.value = code;
			break;

			case "run":
				textarea.hidden = true;
				pre.hidden = false;
				pre.textContent = code;
				code && this.#run();
			break;
		}
	}

	get code() { return this.#code; }
	set code(code) {
		this.#code = code;
		if (!this.isConnected) { return; }

		switch (this.#mode) {
			case "edit":
				this.#textarea.value = code;
			break;

			case "run":
				this.#pre.textContent = code;
				code && this.#run();
			break;
		}
	}

	connectedCallback() {
		const { shadowRoot } = this;
		shadowRoot.innerHTML = HTML;

		this.#pre.textContent = this.#code;
		this.#pre.addEventListener("click", _ => {
			this.mode = "edit";
			this.#textarea.focus();
		});

		this.#textarea.addEventListener("blur", _ => {
			this.code = this.#textarea.value;
			this.mode = "run";
		});

		this.mode = "run";

		connectedXamples.add(this);
	}

	disconnectedCallback() {
		connectedXamples.delete(this);
	}

	async tick() {
		if (this.#pulling || this.#done) { return; }
		this.#pulling = true;

		let gen = this.#generator;
		gen.next().then(({value, done}) => {
			if (gen != this.#generator) { return; }
			this.#pulling = false;
			this.#done = done;
			if (!done) { this.#output.replaceChildren(value); }
		});
	}

	#run() {
		this.#output.replaceChildren();

		try {
			if (this.#generator) {
				this.#generator.return();
				this.#pulling = false;
			}

			let func = new AsyncGeneratorFunction(this.#code);
			this.#generator = func();
			this.#done = false;
			this.tick();
		} catch (e) {
			this.#generator = undefined;
			this.#done = true;
			this.#output.append(e.message);
		}

	}
}

const HTML = `
<style>
:host {
	display: block;
	background-color: #eee;
}

* {
	box-sizing: border-box;
}

[part=textarea], [part=code] {
	--padding: 2px;
	font-family: monospace;
	font-size: inherit;
	margin: 0;
	padding: var(--padding);
	border: none;
	width: 100%;
}

[part=textarea] {
	min-height: calc(3lh + 2*var(--padding));
}

</style>

<output part="output"></output>
<pre part="code"></pre>
<textarea part="textarea"></textarea>
`;

customElements.define("x-ample", ExAmple);

function tick() {
	connectedXamples.forEach(xample => xample.tick());
	requestAnimationFrame(tick);
}
tick();
