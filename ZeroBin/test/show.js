/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("ZeroBin Show Suite", function() {
  
  it("initializes properly", function() {
    var domain = privlyNetworkService.contentServerDomain();
    expect(domain).toBe($(".home_domain").attr("href"));
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
  it("recovers key from localStorage", function() {

    // Save old values
    var oldURLs = ls.getItem("ZeroBin:URLs");
    var oldAppAddress = state.webApplicationURL;

    // Run test
    state.webApplicationURL = "https://priv.ly/test/show?fu=bar";
    ls.setItem("ZeroBin:URLs", state.webApplicationURL + "#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(true);

    // Try something more confusing
    ls.setItem("ZeroBin:URLs", "AAA|AAA|"+
     state.webApplicationURL + "#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(true);

    // Cleanup
    ls.setItem("ZeroBin:URLs", oldURLs);
    state.webApplicationURL = oldAppAddress;
  });

  it("does not recover key from localStorage", function() {

    // Save old values
    var oldURLs = ls.getItem("ZeroBin:URLs");
    var oldAppAddress = state.webApplicationURL;

    // Run test
    state.webApplicationURL = "https://priv.ly/test/show?fu=bar";
    ls.setItem("ZeroBin:URLs", "#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(false);

    // Try something more confusing
    state.webApplicationURL = "https://test.com/fu/bar?fubar=hello_world";
    ls.setItem("ZeroBin:URLs", "||" +
     "https://faketest.com/fu/bar?fubar=hello_world#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(false);

    // Cleanup
    ls.setItem("ZeroBin:URLs", oldURLs);
    state.webApplicationURL = oldAppAddress;
  });
});

