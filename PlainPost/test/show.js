/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("PlainPost Show Suite", function() {
  
  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    var keys = Object.keys(__html__);
    var selectKey;
    keys.forEach(function(key) {
      if( key.indexOf("PlainPost/show.html") >= 0 ) {
        selectKey = key;
      }
    });
    document.body.innerHTML = __html__[selectKey];
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("runs tests", function() {
    expect(true).toBe(true);
  });

});
