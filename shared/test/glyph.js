/**
 * @fileOverview Privly.glyph test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, spyOn */
/*global Privly */
describe('Privly.glyph', function () {

  beforeEach(function () {
    spyOn(Privly.options, 'getGlyph').and.callThrough();
    spyOn(Privly.options, 'setGlyph').and.callThrough();
  });

  it('getGlyph() calls Privly.options.getGlyph()', function () {
    Privly.glyph.getGlyph();
    expect(Privly.options.getGlyph).toHaveBeenCalled();
  });

  it('setGlyph() calls Privly.options.setGlyph()', function () {
    Privly.glyph.setGlyph({
      color: '112233',
      cells: [true, true, true, false, false, true, true, true, false, false, true, true, true, false, false]
    });
    expect(Privly.options.setGlyph).toHaveBeenCalled();
  });

  it('generateGlyph() can generate a new glyph', function () {
    Privly.glyph.generateGlyph();
    var oldGlyph = Privly.options.getGlyph();
    Privly.glyph.generateGlyph();
    var newGlyph = Privly.options.getGlyph();
    expect(newGlyph).not.toBeNull();
    expect(typeof newGlyph).toBe('object');
    expect(newGlyph.color).toBeDefined();
    expect(newGlyph.cells).toBeDefined();
    expect(newGlyph.cells.length).toBe(15);
    expect(oldGlyph.color).not.toEqual(newGlyph.color);
    expect(oldGlyph.cells).not.toEqual(newGlyph.cells);
  });

  it('getGlyphDOM() can generate glyph DOM', function () {
    var table;
    // test no glyph condition
    Privly.storage.remove('options/glyph');
    table = Privly.glyph.getGlyphDOM();
    expect(table.nodeName).toBe('TABLE');
    expect(table.querySelectorAll('td').length).toEqual(25);
    // test glyph condition
    Privly.storage.remove('options/glyph');
    Privly.glyph.generateGlyph();
    var glyph = Privly.glyph.getGlyph();
    table = Privly.glyph.getGlyphDOM();
    expect(Privly.glyph.getGlyph()).toEqual(glyph);
    expect(table.nodeName).toBe('TABLE');
    expect(table.querySelectorAll('td').length).toEqual(25);
  });

  it('initGlyph() creates a glyph when there is no glyph', function () {
    Privly.storage.remove('options/glyph');
    Privly.glyph.initGlyph();
    var glyph = Privly.glyph.getGlyph();
    expect(glyph).not.toBeNull();
    expect(glyph.color).not.toBeNull();
    expect(glyph.cells).not.toBeNull();
  });

  it('initGlyph() doesn\'t create a new glyph when there is a glyph', function () {
    Privly.glyph.generateGlyph();
    var glyph = Privly.glyph.getGlyph();
    Privly.glyph.initGlyph();
    expect(Privly.glyph.getGlyph()).toEqual(glyph);
  });

});
