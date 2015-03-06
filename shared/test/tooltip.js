/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Tooltip Test Suite", function() {
  
  it("does not result in an error", function() {
    privlyTooltip.updateMessage("tested", "tested");

    if( jQuery("privlyHeightWrapper").length === 0 ) {
      return;
    }

    privlyTooltip.tooltip();
    expect(true).toBe(true);
  });
  
  it("can generate a new glyph", function() {
    privlyTooltip.generateNewGlyph();
    var glyphString = ls.getItem("glyph_cells");
    expect(glyphString).toBeDefined();
    expect(ls.getItem("glyph_color")).toBeDefined();
    var glyphArray = glyphString.split(",");
    expect(glyphArray.length).toBe(15);
  });
  
});
