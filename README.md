# &lt;x-ample&gt;

## Installation

The `<x-ample>` can be used in different ways. This makes the installation process somewhat complex, as there are many valid/working approaches. Generally speaking, you need these main steps:

  1. Get the library. You can use a CDN or self-host. Possible approaches include:
      - NPM: `npm i @ondras/x-ample --registry https://npm.pkg.github.com`
      - jsDelivr CDN (supports GitHub repositories and CORS): `https://cdn.jsdelivr.net/gh/ondras/x-ample/x-ample.js`
  1. Connect the library to the page. Possible approaches include:
      - HTML script tag: `<script type="module" src="$URL"></script>`
      - JS module import: `import XAmple from "$URL"`
  1. Get the JS constructor. Possible approaches include:
      - Wait for the CustomElement registration: `let XAmple = await customElements.whenDefined("x-ample")`
      - JS module import: `import XAmple from "$URL"`

## JS instantiation API

While it is possible to simply create the HTML (via `<x-ample></x-ample>` tags), you often want to initialize the example with an existing source code. First, define your source code as a script with a custom type:

```html
<script type="application/x-ample" id="my-source">
return "hello world";
</script>
```

You then use a static factory method:

```js
let script = document.querySelector("#my-source");
let example = XAmple.fromScript(script);
document.body.append(example)
```

Or you can simply replace the source script:

```js
let script = document.querySelector("#my-source");
XAmple.replaceScript(script);
```

## JS API

Existing examples can be modified programtically:

```js
let example = new XAmple();

// set a new source
example.code = "...";

// switch to edit mode
example.mode = "edit";

// switch to view/run mode
example.mode = "view";
```

## CSS API

The `<x-ample>` uses Shadow DOM. Font-related properties (family, size, &hellip;) are inherited and can be specified on the example node:

```css
x-ample {
    font-family: sans-serif;
}
```

To style individual components, use the `::part` pseudo-element:

```css
x-ample::part(code) {
    /* read-only source code */
}

x-ample::part(textarea) {
    /* editable source code */
}

x-ample::part(output) {
    /* output */
}
```


## Syntax highlighting

Your code samples are colorized via [highlight.js](https://highlightjs.org/) when present. Pick any distribution/styling that is appropriate. Using highlight.js styles inside Shadow DOM is tricky; you need to
  1. create a local `CSSStyleSheet`
  1. adopt it inside the &lt;x-ample&gt; via its `adoptStyleSheet` method

Example:

```html
<link rel="stylesheet" crossorigin href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<script>
let hljsStylesheet = new CSSStyleSheet();
let original = document.querySelector("link[crossorigin]");
[...original.sheet.cssRules].forEach(rule => hljsStylesheet.insertRule(rule.cssText));

let example = document.createElement("x-ample");
example.adoptStyleSheet(hljsStylesheet);
</script>
```

## Demo page
https://ondras.github.io/x-ample/

## Awesome!
Built with love (and caribbean rum) by [Ondřej Žára](https://ondras.zarovi.cz/)
