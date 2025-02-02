const AsyncGeneratorFunction = (async function*() {}).constructor;
const HLJS_OPTIONS = {language:"javascript"};

let connectedXamples = new Set();

export default class XAmple extends HTMLElement {
	#mode = "view";
	#code = "";
	#generator;
	#done = false;
	#pulling = false;
	#internals = this.attachInternals();

	get #output() { return this.shadowRoot.querySelector("[part=output]");}
	get #pre() { return this.shadowRoot.querySelector("[part=code]");}
	get #textarea() { return this.shadowRoot.querySelector("[part=textarea]");}

	static fromScript(scriptNode) {
		let example = new this();
		example.code = scriptNode.textContent.replace(/^\s*\n/, "").trimEnd();
		return example;
	}

	static replaceScript(scriptNode) {
		let example = this.fromScript(scriptNode);
		scriptNode.replaceWith(example);
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
		let { states } = this.#internals;

		states.delete("view");
		states.delete("edit");
		states.add(mode);

		switch (mode) {
			case "edit":
				textarea.style.height = `${pre.offsetHeight}px`;
				pre.hidden = true;
				textarea.hidden = false;
				textarea.value = code;
			break;

			case "view":
				textarea.hidden = true;
				pre.hidden = false;
				if (window.hljs) {
					pre.innerHTML = hljs.highlight(code, HLJS_OPTIONS).value;
				} else {
					pre.textContent = code;
				}
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

			case "view":
				if (window.hljs) {
					pre.innerHTML = hljs.highlight(code, HLJS_OPTIONS).value;
				} else {
					pre.textContent = code;
				}
				code && this.#run();
			break;
		}
	}

	connectedCallback() {
		const { shadowRoot } = this;
		shadowRoot.innerHTML = HTML;

		this.#pre.addEventListener("click", _ => {
			this.mode = "edit";
			this.#textarea.focus();
		});

		this.#textarea.addEventListener("blur", _ => {
			this.code = this.#textarea.value;
			this.mode = "view";
		});


		this.mode = "view";

		connectedXamples.add(this);
	}

	disconnectedCallback() {
		connectedXamples.delete(this);
	}

	adoptStyleSheet(stylesheet) {
		this.shadowRoot.adoptedStyleSheets.push(stylesheet);
	}

	async tick() {
		if (this.#pulling || this.#done) { return; }
		this.#pull();
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
			this.#pull();
		} catch (e) {
			this.#generator = undefined;
			this.#done = true;
			this.#output.append(e.message);
		}
	}

	#pull() {
		this.#pulling = true;
		let gen = this.#generator;

		let onPull = (value, done) => {
			if (gen != this.#generator) { return; }
			this.#pulling = false;
			this.#done = done;
			this.#output.replaceChildren(value);
		}
		gen.next().then(
			({value, done}) => onPull(value, done),
			e => onPull(e, true)
		);
	}
}

const HTML = `
<style>
:host {
	display: flex;
	flex-direction: column;
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
}

[part=textarea] {
	min-height: calc(3lh + 2*var(--padding));
}

</style>

<output part="output"></output>
<pre part="code"></pre>
<textarea part="textarea"></textarea>
`;

customElements.define("x-ample", XAmple);

function tick() {
	connectedXamples.forEach(xample => xample.tick());
	requestAnimationFrame(tick);
}
tick();
