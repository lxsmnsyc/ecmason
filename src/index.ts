/**
 * @license
 * MIT License
 *
 * Copyright (c) 2021 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2021
 */

export type BaseJSON = number | string | boolean | null;

export interface ECMASon<R> {
  tag: string;
  value: R;
}

export interface RecursiveRef<T> {
  id: number;
  value: T;
}

export interface Context {
  [key: string]: any;
}

interface RecursiveRegenerator extends Context {
  recursiveRegenerator?: any[];
}

interface RecursiveTracker extends Context {
  recursiveCount?: number;
  recursiveTracker?: WeakMap<any, number>;
}

export interface WithRecursionContext<T> extends Context {
  setRef?: (value: T) => void;
}

export interface ECMASonTransformer<T, R> {
  tag: string;
  check: (value: T) => value is T;
  serialize: (value: T, context: Context) => R;
  deserialize: (value: R, context: Context) => T;
}

const trackedTags: { [key: string]: boolean } = {};

export type TransformerType = 'literal' | 'primitive' | 'object' | 'final';

const TRANSFORMERS: {[key in TransformerType]: ECMASonTransformer<any, any>[]} = {
  literal: [],
  primitive: [],
  object: [],
  final: [],
};

export function addTransformer<T, R>(
  type: TransformerType,
  transformer: ECMASonTransformer<T, R>,
): void {
  if (transformer.tag in trackedTags) {
    throw new Error(`Conflicting tag on '${transformer.tag}'`);
  }
  TRANSFORMERS[type].push(transformer);
}

export function deserialize<T, R>(
  value: ECMASon<R>,
  context: Context = {},
): T {
  for (let k = 0; k < TRANSFORMERS.literal.length; k += 1) {
    const transformer = TRANSFORMERS.literal[k];

    if (value.tag === transformer.tag) {
      return transformer.deserialize(value.value, context);
    }
  }
  for (let k = 0; k < TRANSFORMERS.primitive.length; k += 1) {
    const transformer = TRANSFORMERS.primitive[k];

    if (value.tag === transformer.tag) {
      return transformer.deserialize(value.value, context);
    }
  }
  for (let k = 0; k < TRANSFORMERS.object.length; k += 1) {
    const transformer = TRANSFORMERS.object[k];

    if (value.tag === transformer.tag) {
      return transformer.deserialize(value.value, context);
    }
  }
  for (let k = 0; k < TRANSFORMERS.final.length; k += 1) {
    const transformer = TRANSFORMERS.final[k];

    if (value.tag === transformer.tag) {
      return transformer.deserialize(value.value, context);
    }
  }

  throw new Error(`value of tag "${value.tag}" cannot be deserialized`);
}

export function serialize<T, R>(
  value: T,
  context: Context = {},
): ECMASon<R> {
  for (let i = 0; i < TRANSFORMERS.literal.length; i += 1) {
    const transformer = TRANSFORMERS.literal[i];

    if (transformer.check(value)) {
      return {
        tag: transformer.tag,
        value: transformer.serialize(value, context),
      };
    }
  }
  for (let i = 0; i < TRANSFORMERS.primitive.length; i += 1) {
    const transformer = TRANSFORMERS.primitive[i];

    if (transformer.check(value)) {
      return {
        tag: transformer.tag,
        value: transformer.serialize(value, context),
      };
    }
  }
  for (let i = 0; i < TRANSFORMERS.object.length; i += 1) {
    const transformer = TRANSFORMERS.object[i];

    if (transformer.check(value)) {
      return {
        tag: transformer.tag,
        value: transformer.serialize(value, context),
      };
    }
  }
  for (let i = 0; i < TRANSFORMERS.final.length; i += 1) {
    const transformer = TRANSFORMERS.final[i];

    if (transformer.check(value)) {
      return {
        tag: transformer.tag,
        value: transformer.serialize(value, context),
      };
    }
  }

  throw new Error('value cannot be serialized');
}

export function stringify<T>(value: T): string {
  return JSON.stringify(serialize(value));
}

export function parse<T>(value: string): T {
  return deserialize(JSON.parse(value));
}
/**
 * Literal transformers
 */
addTransformer<number, null>('literal', {
  tag: 'NAN',
  check: (value): value is number => (
    Number.isNaN(value)
  ),
  serialize: () => null,
  deserialize: () => NaN,
});

addTransformer<number, null>('literal', {
  tag: 'INF',
  check: (value): value is number => (
    value === Number.POSITIVE_INFINITY
  ),
  serialize: () => null,
  deserialize: () => Number.POSITIVE_INFINITY,
});

addTransformer<number, null>('literal', {
  tag: '-INF',
  check: (value): value is number => (
    value === Number.NEGATIVE_INFINITY
  ),
  serialize: () => null,
  deserialize: () => Number.NEGATIVE_INFINITY,
});

addTransformer<number, number>('literal', {
  tag: '-0',
  check: (value): value is number => (
    Object.is(value, -0)
  ),
  serialize: () => 0,
  deserialize: () => -0,
});
/**
 * Primitive transformers
 */
addTransformer<bigint, string>('primitive', {
  tag: 'BIGINT',
  check: (value): value is bigint => (
    typeof value === 'bigint'
  ),
  serialize: (value) => value.toString(),
  deserialize: (value) => BigInt(value),
});

// addTransformer<symbol, string | number | null>('primitive', {
//   tag: 'SYMBOL',
//   check: (value): value is symbol => (
//     typeof value === 'symbol'
//   ),
//   serialize: (value) => value.description ?? null,
//   deserialize: (value) => Symbol(value === null ? undefined : value),
// });

addTransformer<BaseJSON, BaseJSON>('primitive', {
  tag: 'PRIMITIVE',
  check: (value): value is BaseJSON => (
    typeof value === 'number'
    || typeof value === 'string'
    || typeof value === 'boolean'
    || value === null
  ),
  serialize: (value) => value,
  deserialize: (value) => value,
});

addTransformer<undefined, null>('primitive', {
  tag: 'UNDEFINED',
  check: (value): value is undefined => (
    typeof value === 'undefined'
  ),
  serialize: () => null,
  deserialize: () => undefined,
});

export function withRecursionTracker<T, R>(
  transformer: ECMASonTransformer<T, R>,
): ECMASonTransformer<T, RecursiveRef<R> | number> {
  return {
    tag: `RECURSIVE(${transformer.tag})`,
    check: transformer.check,
    serialize: (value, context: RecursiveTracker) => {
      const currentTracker = context.recursiveTracker ?? new WeakMap();
      const currentCount = context.recursiveCount ?? 0;

      context.recursiveTracker = currentTracker;

      const tracked = currentTracker.get(value);

      if (tracked != null) {
        context.recursiveCount = currentCount;
        return tracked;
      }
      const newId = currentCount + 1;
      currentTracker.set(value, newId);
      context.recursiveCount = newId;

      return {
        id: newId,
        value: transformer.serialize(value, context),
      };
    },
    deserialize: (value, context: RecursiveRegenerator) => {
      const currentRegenerator = context.recursiveRegenerator ?? [];

      context.recursiveRegenerator = currentRegenerator;

      if (typeof value === 'number') {
        return currentRegenerator[value];
      }

      const deserialized = transformer.deserialize(value.value, {
        ...context,
        setRef: (ref: R): void => {
          currentRegenerator[value.id] = ref;
        },
      });
      currentRegenerator[value.id] = deserialized;
      return deserialized;
    },
  };
}

/**
 * Class (object) transformers
 */
addTransformer<RegExp, [string, string]>('object', {
  tag: 'REGEXP',
  check: (value): value is RegExp => (
    value instanceof RegExp
  ),
  serialize: (value) => [value.source, value.flags],
  deserialize: ([source, flags]) => new RegExp(source, flags),
});

addTransformer<Date, string>('object', {
  tag: 'DATE',
  check: (value): value is Date => (
    value instanceof Date
  ),
  serialize: (value) => value.toISOString(),
  deserialize: (value) => new Date(value),
});

addTransformer('object', withRecursionTracker<Map<any, any>, ECMASon<any>[]>({
  tag: 'MAP',
  check: (value): value is Map<any, any> => (
    value instanceof Map
  ),
  serialize: (value, context) => (
    Array.from(value.entries()).map(
      ([key, val]) => serialize([key, val], context),
    )
  ),
  deserialize: (value, context: WithRecursionContext<Map<any, any>>) => {
    const map = new Map<any, any>();
    context.setRef?.(map);
    value.forEach((source) => {
      const [key, val] = deserialize(source, context);
      map.set(key, val);
    });
    return map;
  },
}));

addTransformer('object', withRecursionTracker<Set<any>, ECMASon<any>[]>({
  tag: 'SET',
  check: (value): value is Set<any> => (
    value instanceof Set
  ),
  serialize: (value, context) => (
    Array.from(value).map(
      (val) => serialize(val, context),
    )
  ),
  deserialize: (value, context: WithRecursionContext<Set<any>>) => {
    const set = new Set<any>();
    context.setRef?.(set);
    value.forEach((val) => {
      set.add(deserialize(val, context));
    });
    return set;
  },
}));

addTransformer('object', withRecursionTracker<Array<any>, ECMASon<any>[]>({
  tag: 'ARRAY',
  check: (value): value is Array<any> => (
    value instanceof Array
  ),
  serialize: (value, context) => (
    value.map((current) => serialize(current, context))
  ),
  deserialize: (value, context: WithRecursionContext<any[]>) => {
    const array: any[] = [];
    context.setRef?.(array);
    value.forEach((current, key) => {
      array[key] = deserialize(current, context);
    });
    return array;
  },
}));

/**
 * Final transformer
 */
addTransformer(
  'final',
  withRecursionTracker<Record<string, unknown>, { [key: string]: ECMASon<any> }>({
    tag: 'OBJECT',
    check: (value): value is Record<string, unknown> => (
      typeof value === 'object'
    ),
    serialize: (value, context) => Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serialize(val, context)]),
    ),
    deserialize: (value, context: WithRecursionContext<Record<string, unknown>>) => {
      const obj: Record<string, unknown> = {};
      context.setRef?.(obj);
      Object.entries(value).forEach(([key, val]) => {
        obj[key] = deserialize(val, context);
      });
      return obj;
    },
  }),
);
