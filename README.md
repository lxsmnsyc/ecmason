# ecmason

> JSON parse/stringify for modern ES objects

[![NPM](https://img.shields.io/npm/v/ecmason.svg)](https://www.npmjs.com/package/ecmason) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)

## Install

```bash
npm install --save ecmason
```

```bash
yarn add ecmason
```

## Usage

```tsx
import { parse, stringify, setup } from 'ecmason';

// Call setup first
setup();

// Support for Map
const a = new Map([
  // Support for Dates
  ['hello', new Date()],
  // Support for Regex
  ['world', /Hello World/],
]);

// Support for plain objects
const object = {
  a,
  // Support for Set
  b: new Set([
    // Support for NaN
    NaN,
    // Support for undefined
    undefined,
    // Support for infinity
    Infinity,
    -Infinity,
  ]),
  c: [
    // Support for signed zeroes
    +0,
    -0,
  ],
};

// Support for recursion
a.set('recursive', object);

const value = ecmason.stringify(object);

// Output:
// {
//   "tag": "RECURSIVE(OBJECT)",
//   "value": {
//     "id": 1,
//     "value": {
//       "a": {
//         "tag": "RECURSIVE(MAP)",
//         "value": {
//           "id": 2,
//           "value": [
//             [{
//               "tag": "PRIMITIVE",
//               "value": "hello"
//             }, {
//               "tag": "DATE",
//               "value": "2021-04-23T17:34:08.630Z"
//             }],
//             [{
//               "tag": "PRIMITIVE",
//               "value": "world"
//             }, {
//               "tag": "REGEXP",
//               "value": ["Hello World", ""]
//             }],
//             [{
//               "tag": "PRIMITIVE",
//               "value": "recursive"
//             }, {
//               "tag": "RECURSIVE(OBJECT)",
//               "value": 1
//             }]
//           ]
//         }
//       },
//       "b": {
//         "tag": "RECURSIVE(SET)",
//         "value": {
//           "id": 3,
//           "value": [{
//             "tag": "NAN",
//             "value": null
//           }, {
//             "tag": "UNDEFINED",
//             "value": null
//           }, {
//             "tag": "INF",
//             "value": null
//           }, {
//             "tag": "-INF",
//             "value": null
//           }]
//         }
//       },
//       "c": {
//         "tag": "RECURSIVE(ARRAY)",
//         "value": {
//           "id": 4,
//           "value": [{
//             "tag": "+0",
//             "value": 0
//           }, {
//             "tag": "-0",
//             "value": 0
//           }]
//         }
//       }
//     }
//   }
// }
console.log(value);

// Output (Node)
// <ref *1> {
//   a: Map(3) {
//     'hello' => 2021-04-23T17:34:08.630Z,
//     'world' => /Hello World/,
//     'recursive' => [Circular *1]
//   },
//   b: Set(4) { NaN, undefined, Infinity, -Infinity },
//   c: [ 0, -0 ]
// }
console.log(ecmason.parse(value));
```

## Features

### ECMAScript globals

The following are values and classes supported by `ecmason`, ordered from highest priority:

- Literal Transformers
  - `NaN`
  - `Number.POSITIVE_INFINITY` or `Infinity`
  - `Number.NEGATIVE_INFINITY` or `-Infinity`
  - `-0`
- Primitive Transformers
  - `BigInt`
  - `Symbol` (disabled; needs `ES2019`)
  - `number`, `string`, `boolean` and `null`
  - `undefined`
- Object Transformers
  - `RegExp`
  - `Date`
  - `Map`
  - `Set`
  - `Array`
- Final Transformers
  - `Object`

### Custom transformers

To be documented

### Recursive references

Recursive references in `Map`, `Set`, `Array` and `Object` are handled as well.

## Cons

To preserve data safety-ness, the output result of `stringify` is verbose, which is done in an AST-like implementation, which allows us to preserve contextual data. Plain parsing will be inconveniently make the data inaccessible.

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
