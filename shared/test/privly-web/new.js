/**
 * @fileOverview tests.js Gives testing code for the Privly-web
 * API adapter.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly-web new.js API Test Suite", function() {

  beforeEach(function() {
    var domIDs = [
      "logout_link"
    ];
    domIDs.forEach(function(id){
      var newElement = $('<a/>', {
        id: id,
      });
      $(document.body).append(newElement);
    });
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
  
  
  it("does not result in an error (createError)", function(done) {
    callbacks.createError({jqXHR: {status: "500"}}, done);
  });
  
  it("does not result in an error (postComplete)", function(done) {
    callbacks.postCompleted( {jqXHR: {status: 201}, url: "mock"}, "URL",
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
