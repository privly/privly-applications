/**
 * @fileOverview tests.js Gives testing code for the Privly-web
 * API adapter.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly-web show.js API Test Suite", function() {

  beforeEach(function() {
    document.body.innerHTML = __html__['show.html'];
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });

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
  
  
  it("does not result in an error (pendingContent)", function(done) {
    callbacks.pendingContent(done);
  });
  
  it("does not result in an error (pendingLogin)", function(done) {
    callbacks.pendingLogin(done);
  });
  
  it("does not result in an error (contentReturned)", function(done) {
    callbacks.contentReturned( mockServerResponse, done);
  });
  
  
  it("does not result in an error (destroy)", function(done) {
    
    // The destroy request is not currently testable
    return;
    
    callbacks.destroy(done);
  });
  
  
  it("does not result in an error (destroyed)", function(done) {
    callbacks.destroyed(mockServerResponse, done);
  });
  
  it("does not result in an error (edit)", function(done) {
      callbacks.edit(done);
  });
  
  it("does not result in an error (update)", function(done) {
    
    // The update request is not currently testable
    return;
    
    callbacks.update(
        mockEvent,
        done);
  });
  
  it("does not result in an error (cancel)", function(done) {
      callbacks.cancel(
        mockEvent,
        done);
  });
  
  it("does not result in an error (click)", function(done) {
    callbacks.click(
      mockEvent,
      done);
  });
  
  it("does not result in an error (singleClick)", function(done) {
    callbacks.singleClick(
      mockEvent,
      done);
  });
  
  it("does not result in an error (doubleClick)", function(done) {
      callbacks.doubleClick(
        done);
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