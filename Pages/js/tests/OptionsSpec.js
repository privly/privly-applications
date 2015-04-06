/**
 * @fileOverview tests.js Gives testing code for the options page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Options Suite", function() {

  beforeEach(function() {

    // Initialize the content server
    ls.setItem("posting_content_server_url", "https://dev.privly.org");

    // Initialize the spoofing glyph
    ls.setItem("glyph_color", Math.floor(Math.random()*16777215).toString(16));
    var glyph_cells = ((Math.random() < 0.5) ? "false" : "true");
    for(i = 0; i < 14; i++) {
      glyph_cells += "," + ((Math.random() < 0.5) ? "false" : "true");
    }
    ls.setItem("glyph_cells", glyph_cells);

    // Expected DOM
    var e = $("<div id='glyph_div'></div>");
    $('body').append(e);
  });

  it("tests writeability of glyph", function() {
    writeGlyph();
    expect(document.getElementById("glyph_div").children.length).toEqual(1);
  });

  it("tests generation of new glyph", function() {
    var oldColor = ls.getItem("glyph_color");
    var oldGlyph = ls.getItem("glyph_cells");
    regenerateGlyph();
    expect(oldColor).not.toEqual(ls.getItem("glyph_color"));
    expect(oldGlyph).not.toEqual(ls.getItem("glyph_cells"));
  });

  it("tests domain validation", function() {
    // Valid domains that should pass
    expect(isValidDomain('localhost')).toBe(true);
    expect(isValidDomain('localhost:3000')).toBe(true);
    expect(isValidDomain('example.com:3000')).toBe(true);
    expect(isValidDomain('example.example.com:3000')).toBe(true);
    expect(isValidDomain('example.example.example.com:3000')).toBe(true); 
  
    // Invalid domains that shouldn't pass
    expect(isValidDomain('.com:3000')).toBe(false); 
    expect(isValidDomain('locahost@')).toBe(false);
    expect(isValidDomain('inva!id.com')).toBe(false);
    expect(isValidDomain('l@calhost')).toBe(false);
    expect(isValidDomain('locahost:30o0')).toBe(false);
    expect(isValidDomain('.not.valid.com')).toBe(false);
    expect(isValidDomain('example.')).toBe(false);
    expect(isValidDomain('..example.com')).toBe(false);
    expect(isValidDomain('example..com')).toBe(false);
    expect(isValidDomain('example.com.')).toBe(false);
    expect(isValidDomain(' example.com')).toBe(false);
    expect(isValidDomain('example.com ')).toBe(false);
    expect(isValidDomain('/path/but/not/domain/')).toBe(false);
    expect(isValidDomain(' ')).toBe(false);
    expect(isValidDomain('the quick brown fox jumps over the lazy dog')).toBe(false);

  });

});
