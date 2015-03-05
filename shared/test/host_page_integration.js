/**
 * @fileOverview tests.js Gives testing code for when the application is
 * injected into another application.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Host Page Integration Test Suite", function() {
  
  it("does not result in an error", function(done) {

    if( ! privlyHostPage.isInjected() || jQuery("privlyHeightWrapper").length === 0 ) {
      done();
      return;
    }
    
    privlyHostPage.dispatchResize(1000);
    privlyHostPage.dispatchResize(15);
    var newHeight = 18; // add 18px just to accommodate the tooltip

    privlyHostPage.resizeToWrapper();
    expect(true).toBe(true);
    done();
  });
  
});
