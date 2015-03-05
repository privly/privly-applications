/**
 * @fileOverview tests.js Gives testing code for the options page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Options Suite", function() {
  
  // Load the fixtures from html2js
  var keys = Object.keys(__html__);
  var selectKey;
  keys.forEach(function(key) {
    if( key.indexOf("Pages/ChromeOptions.html") >= 0 ) {
      selectKey = key;
    }
  });

  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    document.body.innerHTML = __html__[selectKey];

    // Initialize the content server
    ls.setItem("posting_content_server_url", "https://dev.privly.org");

    // Initialize the spoofing glyph
    ls.setItem("glyph_color", Math.floor(Math.random()*16777215).toString(16));
    var glyph_cells = ((Math.random() < 0.5) ? "false" : "true");
    for(i = 0; i < 14; i++) {
      glyph_cells += "," + ((Math.random() < 0.5) ? "false" : "true");
    }
    ls.setItem("glyph_cells", glyph_cells);

    restoreCheckedSetting(); // Restore value of the checkbox according to local storage
    restoreWhitelist(); // Save updates to the white list
    listeners(); // Listen for UI events
    writeGlyph(); // Write the spoofing glyph to the page
  });
  
  var value, flag;
  
  it("tests localStorage bindings", function() {
    expect((ls.getItem("posting_content_server_url")).length).toBeGreaterThan(0);
    expect((ls.getItem("glyph_color")).length).toBeGreaterThan(0);
    expect((ls.getItem("glyph_cells")).split(",").length).toBeGreaterThan(5);
  });
  
  it("tests writeability of glyph", function() {
    writeGlyph();
  });
  
  it("tests generation of new glyph", function() {
    var oldColor = ls.getItem("glyph_color");
    var oldGlyph = ls.getItem("glyph_cells");
    regenerateGlyph();
    expect(oldColor).not.toEqual(ls.getItem("glyph_color"));
    expect(oldGlyph).not.toEqual(ls.getItem("glyph_cells"));
    writeGlyph();
  });

});
