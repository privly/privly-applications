/**
 * @fileOverview Privly.glyph test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect */
/*global Privly */
describe('Privly.glyph', function () {

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
    var table = Privly.glyph.getGlyphDOM();
    expect(table.nodeName).toBe('TABLE');
    expect(table.querySelectorAll('td').length).toEqual(25);
  });

});
