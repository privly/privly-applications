/**
 * @fileOverview tests.js Gives testing code for the Privly-web
 * API adapter.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly-web show.js API Test Suite", function() {
  
  /**
   * An event to simulate the click events that the callback
   * expects.
   */
  var mockEvent = {
    stopPropagation: function() {}
  }
  
  /**
   * A mock server response to test the post-processing functions.
   */
  var mockServerResponse = {
    jqXHR: {status: 200},
    json: {content: "hello world"}
  }
  
  
  it("does not result in an error (pendingContent)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.pendingContent(function(){
        initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (pendingLogin)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.pendingLogin(function(){initializationFlag = true});
      
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (contentReturned)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.contentReturned( mockServerResponse, function(){initializationFlag = true});
      
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  
  it("does not result in an error (destroy)", function() {
    
    // The destroy request is not currently testable
    return;
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.destroy(function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  
  it("does not result in an error (destroyed)", function() {
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.destroyed(mockServerResponse, function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (edit)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.edit(
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (update)", function() {
    
    // The update request is not currently testable
    return;
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.update(
        mockEvent,
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (cancel)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.cancel(
        mockEvent,
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (click)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.click(
        mockEvent,
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (singleClick)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.singleClick(
        mockEvent,
        function(){initializationFlag = true});
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
  });
  
  it("does not result in an error (doubleClick)", function() {
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      callbacks.doubleClick(
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