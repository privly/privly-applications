/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect */
/*global Privly */
describe('Privly.Storage', function () {

  it('should preserve data type', function () {
    Privly.Storage.set('key', null);
    expect(Privly.Storage.get('key')).toBe(null);

    Privly.Storage.set('key', true);
    expect(Privly.Storage.get('key')).toBe(true);

    Privly.Storage.set('key', false);
    expect(Privly.Storage.get('key')).toBe(false);

    Privly.Storage.set('key', '');
    expect(Privly.Storage.get('key')).toBe('');

    Privly.Storage.set('key', 'some string');
    expect(Privly.Storage.get('key')).toBe('some string');

    Privly.Storage.set('key', [1, 2, 3]);
    expect(Privly.Storage.get('key')).toEqual([1, 2, 3]);

    Privly.Storage.set('key', 10.5);
    expect(Privly.Storage.get('key')).toBe(10.5);

    Privly.Storage.set('key', {a: 1, b: 2, c: {d: 3}});
    expect(Privly.Storage.get('key')).toEqual({a: 1, b: 2, c: {d: 3}});

    Privly.Storage.set('key', [null, null]);
    expect(Privly.Storage.get('key')).toEqual([null, null]);

    Privly.Storage.set('key', [1, "2", 3.5, null]);
    expect(Privly.Storage.get('key')).toEqual([1, "2", 3.5, null]);

    Privly.Storage.set('key', 'null');
    expect(Privly.Storage.get('key')).toBe('null');

    Privly.Storage.set('key', '[]');
    expect(Privly.Storage.get('key')).toBe('[]');

    Privly.Storage.set('key', '{}');
    expect(Privly.Storage.get('key')).toBe('{}');

    Privly.Storage.set('key', '""');
    expect(Privly.Storage.get('key')).toBe('""');

    Privly.Storage.set('key', 'undefined');
    expect(Privly.Storage.get('key')).toBe('undefined');

    Privly.Storage.set('key', 'true');
    expect(Privly.Storage.get('key')).toBe('true');

    Privly.Storage.set('key', 'false');
    expect(Privly.Storage.get('key')).toBe('false');
  });

  it('should return null when getting non-exist values', function () {
    Privly.Storage.set('key', 'hello');
    expect(Privly.Storage.get('key')).toBe('hello');
    Privly.Storage.remove('key');
    expect(Privly.Storage.get('key')).toBe(null);
  });

});
