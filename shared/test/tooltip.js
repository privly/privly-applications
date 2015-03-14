/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Tooltip Test Suite", function() {
  
  it("does not result in an error", function() {
    privlyTooltip.updateMessage("tested", "tested");

    if( jQuery("privlyHeightWrapper").length === 0 ) {
      return;
    }

    privlyTooltip.tooltip();
    expect(true).toBe(true);
  });
  
});
