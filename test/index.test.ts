import { parse, stringify } from '../src';

describe('Literals', () => {
  describe('NaN', () => {
    it('should recover NaN values', () => {
      expect(Number.isNaN(parse(stringify(NaN)))).toBe(true);
    });
  });
  describe('Infinity', () => {
    it('should recover Infinity values', () => {
      expect(parse(stringify(Infinity))).toBe(Infinity);
    });
  });
  describe('-Infinity', () => {
    it('should recover -Infinity values', () => {
      expect(parse(stringify(-Infinity))).toBe(-Infinity);
    });
  });
  describe('+0', () => {
    it('should recover +0 values', () => {
      expect(parse(stringify(+0))).toBe(+0);
    });
  });
  describe('-0', () => {
    it('should recover -0 values', () => {
      expect(parse(stringify(-0))).toBe(-0);
    });
  });
});
describe('Primitives', () => {
  describe('BigInt', () => {
    it('should recover BigInt values', () => {
      const bigint = BigInt("0b11111111111111111111111111111111111111111111111111111");
      expect(parse(stringify(bigint))).toBe(bigint);
    });
  });
  // describe('Symbol', () => {
  //   it('should recover Symbol values', () => {
  //     const value = Symbol('example');
  //     expect(parse<symbol>(stringify(value)).description).toBe(value.description);
  //   });
  // });
  describe('undefined', () => {
    it('should recover undefined values', () => {
      expect(parse(stringify(undefined))).toBe(undefined);
    });
  });
});
describe('Objects', () => {
  describe('Map', () => {
    it('should recover Map values', () => {
      const map = new Map([['a', 1], ['b', 2]]);

      const recovered = parse<Map<string, number>>(stringify(map));
      expect(recovered.size).toBe(2);
      expect(recovered.get('a')).toBe(1);
      expect(recovered.get('b')).toBe(2);
    });
  });
  describe('Set', () => {
    it('should recover Set values', () => {
      const set = new Set([1, 2]);

      const recovered = parse<Set<number>>(stringify(set));
      expect(recovered.size).toBe(2);
      expect(recovered.has(1)).toBe(true);
      expect(recovered.has(2)).toBe(true);
    });
  });
  describe('Array', () => {
    it('should recover Array values', () => {
      const array = [1, 2];

      const recovered = parse<number[]>(stringify(array));
      expect(recovered.length).toBe(2);
      expect(recovered[0]).toBe(1);
      expect(recovered[1]).toBe(2);
    });
  });
  describe('Date', () => {
    it('should recover Date values', () => {
      const value = new Date();
      const recovered = parse<Date>(stringify(value));
      expect(recovered.getTime()).toBe(value.getTime());
    });
  });
  describe('RegExp', () => {
    it('should recover RegExp values', () => {
      const value = /test/g;
      const recovered = parse<RegExp>(stringify(value));
      expect(recovered.toString()).toBe(value.toString());
      expect(recovered.flags).toBe(value.flags);
      expect(recovered.source).toBe(value.source);
    });
  });
});
describe('Final', () => {
  it('should recover objects', () => {
    const map = {
      a: 1,
      b: 2,
    };

    const recovered = parse<Record<string, number>>(stringify(map));
    expect(recovered.a).toBe(1);
    expect(recovered.b).toBe(2);
  })
});
describe('recursive objects', () => {
  describe('Map', () => {
    it('should recover itself', () => {
      const map = new Map();
      map.set('self', map);

      type RecursiveMap = Map<string, RecursiveMap>;
      const recovered = parse<RecursiveMap>(stringify(map));

      expect(recovered.size).toBe(1);
      expect(recovered.get('self')).toBe(recovered);
    });
  });
  describe('Set', () => {
    it('should recover itself', () => {
      const value = new Set();
      value.add(value);

      type RecursiveSet = Set<RecursiveSet>;
      const recovered = parse<RecursiveSet>(stringify(value));

      expect(recovered.size).toBe(1);
      expect(recovered.has(recovered)).toBe(true);
    });
  });
  describe('Array', () => {
    it('should recover itself', () => {
      const value: RecursiveArray = [];
      value[0] = value;

      type RecursiveArray = RecursiveArray[];
      const recovered = parse<RecursiveArray>(stringify(value));

      expect(recovered.length).toBe(1);
      expect(recovered[0]).toBe(recovered);
    });
  });
  describe('Object', () => {
    it('should recover itself', () => {
      const value: RecursiveRecord = {};
      value.self = value;

      type RecursiveRecord = {
        [key: string]: RecursiveRecord,
      };
      const recovered = parse<RecursiveRecord>(stringify(value));

      expect(recovered.self).toBe(recovered);
    });
  });
});
describe('mutually recursive objects', () => {
  describe('Map', () => {
    it('should recover both instances', () => {
      const a = new Map();
      const b = new Map();

      a.set('b', b);
      b.set('a', a);

      type RecursiveMap = Map<string, RecursiveMap>;
  
      const recovered = parse<Record<string, RecursiveMap>>(stringify({
        a,
        b,
      }));

      expect('a' in recovered).toBe(true);
      expect('b' in recovered).toBe(true);
      expect(recovered.a.get('b')).toBe(recovered.b);
      expect(recovered.b.get('a')).toBe(recovered.a);
    });
  });
  describe('Set', () => {
    it('should recover both instances', () => {
      const a = new Set();
      const b = new Set();

      a.add(b);
      b.add(a);

      type RecursiveSet = Set<RecursiveSet>;
  
      const recovered = parse<Record<string, RecursiveSet>>(stringify({
        a,
        b,
      }));

      expect('a' in recovered).toBe(true);
      expect('b' in recovered).toBe(true);
      expect(recovered.a.has(recovered.b)).toBe(true);
      expect(recovered.b.has(recovered.a)).toBe(true);
    });
  });
  describe('Array', () => {
    it('should recover both instances', () => {
      const a: RecursiveArray = [];
      const b: RecursiveArray = [];

      a[0] = b;
      b[0] = a;

      type RecursiveArray = RecursiveArray[];
  
      const recovered = parse<Record<string, RecursiveArray>>(stringify({
        a,
        b,
      }));

      expect('a' in recovered).toBe(true);
      expect('b' in recovered).toBe(true);
      expect(recovered.a[0]).toBe(recovered.b);
      expect(recovered.b[0]).toBe(recovered.a);
    });
  });
  describe('Object', () => {
    it('should recover both instances', () => {
      const a: RecursiveRecord = {};
      const b: RecursiveRecord = {};

      a.b = b;
      b.a = a;

      type RecursiveRecord = {
        [key: string]: RecursiveRecord,
      };
  
      const recovered = parse<Record<string, RecursiveRecord>>(stringify({
        a,
        b,
      }));

      expect('a' in recovered).toBe(true);
      expect('b' in recovered).toBe(true);
      expect(recovered.a.b).toBe(recovered.b);
      expect(recovered.b.a).toBe(recovered.a);
    });
  });
});

