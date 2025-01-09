const AsyncGeneratorFunction = (async function*() {}).constructor;

let connectedXamples = new Set();

export default class ExAmple extends HTMLElement {
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

	get code() { return this.#code; }
	set code(code) {
		this.#code = code;
		let func = new AsyncGeneratorFunction(this.#code);
		this.#generator = func();
		this.#done = false;

		if (this.isConnected) {
			this.#pre.textContent = this.#code;
			this.#output.replaceChildren();
		}
	}

	connectedCallback() {
		const { shadowRoot } = this;
		shadowRoot.innerHTML = HTML;

		this.#pre.textContent = this.#code;
		this.#pre.addEventListener("click", _ => {
			let height = this.#pre.offsetHeight;
			this.#showTextarea();
			this.#textarea.style.height = `${height}px`;
			this.#textarea.focus();
		});

		this.#hideTextarea();
		this.#textarea.addEventListener("blur", _ => {
			this.code = this.#textarea.value;
			this.#hideTextarea();
		});

		connectedXamples.add(this);
	}

	disconnectedCallback() {
		connectedXamples.delete(this);
	}

	async tick() {
		if (this.#pulling || this.#done) { return; }
		this.#pulling = true;
		let { value, done } = await this.#generator.next();
		this.#pulling = false;
		this.#done = done;

		if (!done) { this.#output.replaceChildren(value); }
	}

	#showTextarea() {
		this.#pre.hidden = true;
		this.#textarea.hidden = false;
		this.#textarea.value = this.#code;
	}

	#hideTextarea() {
		this.#textarea.hidden = true;
		this.#pre.hidden = false;
		this.#pre.textContent = this.#code;
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

textarea, pre {
	font-family: monospace;
	font-size: inherit;
	margin: 0;
	padding: 0;
	width: 100%;
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
