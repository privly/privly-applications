/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Login Suite", function() {
  
  it("logs into remote content server", function() {
    
    console.warn("This test will only succeed if danger.dont.use.bork.bork.bork@privly.org" + 
      " is a user defined on the server");
    
    // set the user and password to the testing user
    $("#user_email").val("danger.dont.use.bork.bork.bork@privly.org");
    $("#user_password").val("danger.dont.use.bork.bork.bork");
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;

    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      $("#login").click();
    });
    
    // The UI message
    var contentServerMessage = "You are currently logged in to " + 
      privlyNetworkService.contentServerDomain();
    
    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return $("#messages").text() === contentServerMessage;
    }, "The user could not authenticate with the server", 1000);
  });
  
});
