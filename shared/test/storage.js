/**
 * @fileOverview Privly.storage test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect */
/*global Privly */
describe('Privly.storage', function () {

  it('should preserve data type', function () {
    Privly.storage.set('key', null);
    expect(Privly.storage.get('key')).toBe(null);

    Privly.storage.set('key', true);
    expect(Privly.storage.get('key')).toBe(true);

    Privly.storage.set('key', false);
    expect(Privly.storage.get('key')).toBe(false);

    Privly.storage.set('key', '');
    expect(Privly.storage.get('key')).toBe('');

    Privly.storage.set('key', 'some string');
    expect(Privly.storage.get('key')).toBe('some string');

    Privly.storage.set('key', [1, 2, 3]);
    expect(Privly.storage.get('key')).toEqual([1, 2, 3]);

    Privly.storage.set('key', 10.5);
    expect(Privly.storage.get('key')).toBe(10.5);

    Privly.storage.set('key', {a: 1, b: 2, c: {d: 3}});
    expect(Privly.storage.get('key')).toEqual({a: 1, b: 2, c: {d: 3}});

    Privly.storage.set('key', [null, null]);
    expect(Privly.storage.get('key')).toEqual([null, null]);

    Privly.storage.set('key', [1, "2", 3.5, null]);
    expect(Privly.storage.get('key')).toEqual([1, "2", 3.5, null]);

    Privly.storage.set('key', 'null');
    expect(Privly.storage.get('key')).toBe('null');

    Privly.storage.set('key', '[]');
    expect(Privly.storage.get('key')).toBe('[]');

    Privly.storage.set('key', '{}');
    expect(Privly.storage.get('key')).toBe('{}');

    Privly.storage.set('key', '""');
    expect(Privly.storage.get('key')).toBe('""');

    Privly.storage.set('key', 'undefined');
    expect(Privly.storage.get('key')).toBe('undefined');

    Privly.storage.set('key', 'true');
    expect(Privly.storage.get('key')).toBe('true');

    Privly.storage.set('key', 'false');
    expect(Privly.storage.get('key')).toBe('false');
  });

  it('should return null when getting non-exist values', function () {
    Privly.storage.set('key', 'hello');
    expect(Privly.storage.get('key')).toBe('hello');
    Privly.storage.remove('key');
    expect(Privly.storage.get('key')).toBe(null);
  });

});
