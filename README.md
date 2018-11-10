# shaderhud

This library displays a shader editor over your `<canvas>` that lets you modify your WebGL's
shaders. This makes it easy to perform experiments and diagnostics. It's mostly for debugging.

To use shaderhud, simply paste this into your browser's developer console:

```js
const script = document.createElement('script');
script.src = '//unpkg.com/shaderhud';
document.head.appendChild(script);
```
