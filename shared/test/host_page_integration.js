/**
 * @fileOverview tests.js Gives testing code for when the application is
 * injected into another application.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Host Page Integration Test Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "privlyHeightWrapper"
    ];
    domIDs.forEach(function(id){
      var newElement = $('<div/>', {
        id: id
      });
      $(document.body).append(newElement);
    });
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("is in the injected context", function(done) {

    // Karma runs inside iframes, so the app will always think it is
    // injected
    expect(privlyHostPage.isInjected()).toBe(true);
    done();
  });

  it("sends resize message", function(done) {
    function listenerTest(message) {
      if ( message.data.indexOf(1000) !== -1 ) {
        window.parent.removeEventListener('message', listenerTest);
        done();
      }
    }
    window.parent.addEventListener ("message", listenerTest, false);
    privlyHostPage.dispatchResize(1000);
  });

  it("sends resize event", function(done) {
    function listenerTest(event) {
      if ( event.target.getAttribute("Height") === "1000" ) {
        window.removeEventListener('IframeResizeEvent', listenerTest);
        setTimeout(done, 1); // Let the message fire before terminating
      }
    }
    window.addEventListener('IframeResizeEvent', listenerTest);
    privlyHostPage.dispatchResize(1000);
  });

  it("resizes to wrapper", function(done) {
    function listenerTest(message) {
      expect(message.data.indexOf(",") > -1).toBe(true);
      if ( message.data.indexOf(15) === -1 ) {
        window.parent.removeEventListener('message', listenerTest);
        done();
      }
    }
    window.parent.addEventListener("message", listenerTest, false);
    privlyHostPage.resizeToWrapper();
  });
});
