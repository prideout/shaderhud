This package displays a shader editor over your `<canvas>` that lets you modify the GLSL
code in any running WebGL app. This makes it easy to perform experiments and diagnostics.

To inject shaderhud, first paste this into your browser's developer console:

```js
const script = document.createElement('script');
script.src = '//unpkg.com/shaderhud';
document.head.appendChild(script);
```

Next you need to activate the widget by calling the `shaderhud()` function, passing in your
canvas element and context. Here's an example for a [Filament] app:

```js
const canvas = document.getElementsByTagName('canvas')[0];
shaderhud(canvas, Filament.ctx);
```

[Filament]: https://github.com/google/filament
