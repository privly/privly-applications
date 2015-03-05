/**
 * @fileOverview tests.js Gives testing code for the Privly-web
 * API adapter.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly-web new.js API Test Suite", function() {
  

  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    var keys = Object.keys(__html__);
    var selectKey;
    keys.forEach(function(key) {
      if( key.indexOf("Message/new.html") >= 0 ) {
        selectKey = key;
      }

  /**
   * A mock server response to test the post-processing functions.
   */
  var mockServerResponse = {
    jqXHR: {status: 200},
    json: {content: "hello world"}
  }
  
  it("does not result in an error (pending login)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.pendingLogin(function(){
        initializationFlag = true});
    });
    document.body.innerHTML = __html__[selectKey];
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });
  
  it("does not result in an error (pending login)", function(done) {
    callbacks.pendingLogin(done);
  });
  
  it("does not result in an error (loginFailure)", function(done) {
    callbacks.loginFailure(done);
  });
  
  it("does not result in an error (pendingPost)", function(done) {
    callbacks.pendingPost(done);
  });
  
  it("does not result in an error (postSubmit)", function(done) {
    callbacks.postSubmit( {jqXHR: {status: "500"}}, "TestFunction", 10, "",
        done);
  });
  
  
<<<<<<< HEAD
  it("does not result in an error (createError)", function(done) {
    callbacks.createError({jqXHR: {status: "500"}}, done);
  });
  
  it("does not result in an error (postComplete)", function(done) {
    callbacks.postCompleted( {jqXHR: {status: 201}, url: "mock"}, "URL",
        done);
=======
  it("does not result in an error (createError)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.createError( mockServerResponse,
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (postComplete)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.postCompleted( mockServerResponse, "URL", 
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
>>>>>>> upstream/experimental-SplitImage
  });
  
  it("can differentiate a function from not a function", function() {
    function sham(not_defined) {
      expect(callbacks.functionExists(not_defined)).toBe(false);
      return true;
    }
    expect(callbacks.functionExists(sham)).toBe(true);
    expect(callbacks.functionExists("")).toBe(false);
    expect(callbacks.functionExists(1)).toBe(false);
    sham();
  });
  
});
