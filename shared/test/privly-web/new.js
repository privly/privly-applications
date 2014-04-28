/**
 * @fileOverview tests.js Gives testing code for the Privly-web
 * API adapter.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly-web new.js API Test Suite", function() {
  
  it("does not result in an error (pending login)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.pendingLogin(function(){
        initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (loginFailure)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.loginFailure(function(){initializationFlag = true});
      
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (pendingPost)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.pendingPost(function(){initializationFlag = true});
      
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  
  it("does not result in an error (postSubmit)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.postSubmit( {}, "TestFunction", 10, "", 
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  
  it("does not result in an error (createError)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.createError(function(){initializationFlag = true});
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
      callbacks.postCompleted( {}, "URL", 
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
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