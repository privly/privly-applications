/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Index New Suite", function() {
  
  it("initializes properly", function() {
    var domain = privlyNetworkService.contentServerDomain();
    expect(domain).toBe($(".home_domain").attr("href"));
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
  it("does not result in an error", function() {
    resizeIframePostedMessage("sham");
    expect(true).toBe(true);
  });
  
});
