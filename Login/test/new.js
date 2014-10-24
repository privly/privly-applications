/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Login Suite", function() {
  
  // Load the fixtures from html2js
  var keys = Object.keys(__html__);
  var selectKey;
  keys.forEach(function(key) {
    if( key.indexOf("Login/new.html") >= 0 ) {
      selectKey = key;
    }
  });

  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    document.body.innerHTML = __html__[selectKey];
  });

  it("Does not result in an error", function() {
    
    console.warn("This test will only succeed if danger.dont.use.bork.bork.bork@privly.org" + 
      " is a user defined on the server");
    
    // set the user and password to the testing user
    $("#user_email").val("danger.dont.use.bork.bork.bork@privly.org");
    $("#user_password").val("danger.dont.use.bork.bork.bork");
    
    $("#login").click();
  });
  
});
