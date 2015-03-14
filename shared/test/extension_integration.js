/**
 * @fileOverview tests.js Gives testing spec for communicating
 * with extensions.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Extension Integration Test Suite", function() {
  
  it("can initialize message pathway", function() {
    if (privlyNetworkService.platformName() === "HOSTED") return;
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;

    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      privlyExtension.messageSecret = function() {
        initializationFlag = true;
      }
      privlyExtension.firePrivlyMessageSecretEvent();
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The message pathway was not initialized", 1000);
    
  });
  
  it("can receive initial content from the extension", function() {
    if (privlyNetworkService.platformName() === "HOSTED") return;
    
    // used to check if asynchronous calls completed
    var initializationFlag = false;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      
      //register the message listener
      privlyExtension.messageSecret = function() {
        
        //register the message listener
        privlyExtension.initialContent = function(data) {
          expect(typeof data.initialContent === 'string').toBe(true);
          initializationFlag = true;
        }
        
        privlyExtension.messageExtension("initialContent", "");
      }
      privlyExtension.firePrivlyMessageSecretEvent();
    });

    // Waits for the initialization to complete or fails
    waitsFor(function() {
      return initializationFlag;
    }, "The app was not initialized", 1000);
    
  });
  
  it("can send URL event without error", function() {
    privlyExtension.firePrivlyURLEvent("TEST");
  });
  
});
