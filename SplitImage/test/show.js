/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("SplitImaage Show Suite", function() {
  
  it("initializes properly", function() {
    var domain = privlyNetworkService.contentServerDomain();
    expect(domain).toBe($(".home_domain").attr("href"));
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
});

