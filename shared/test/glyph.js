/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Glyph Test Suite", function() {
  
  it("can generate a new glyph", function() {
    Privly.Glyph.generateGlyph();
    var oldGlyph = Privly.options.getGlyph();
    Privly.Glyph.generateGlyph();
    var newGlyph = Privly.options.getGlyph();
    expect(newGlyph).not.toBeNull();
    expect(typeof newGlyph).toBe('object');
    expect(newGlyph.color).toBeDefined();
    expect(newGlyph.cells).toBeDefined();
    expect(newGlyph.cells.length).toBe(15);
    expect(oldGlyph.color).not.toEqual(newGlyph.color);
    expect(oldGlyph.cells).not.toEqual(newGlyph.cells);
  });

  it("can generate glyph DOM", function() {
    var table = Privly.Glyph.getGlyphDOM();
    expect(table.nodeName).toBe('TABLE');
    expect(table.querySelectorAll('td').length).toEqual(25);
  });
  
});
