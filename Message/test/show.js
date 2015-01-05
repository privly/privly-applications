/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Message Show Suite", function() {

  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    var keys = Object.keys(__html__);
    var selectKey;
    keys.forEach(function(key) {
      if( key.indexOf("Message/show.html") >= 0 ) {
        selectKey = key;
      }
    });
    document.body.innerHTML = __html__[selectKey];
  });

  it("initializes properly", function() {

    initializeApplication();

    var domain = privlyNetworkService.contentServerDomain();

    if( privlyNetworkService.platformName() !== "HOSTED" ) {

      // if the app is not hosted, the user should first be directed to the
      // content_server page of the app bundle.
      expect($(".home_domain").attr("href")).toBe('../Help/content_server.html');
    } else {

      // if the application is hosted, the URL should connect to the domain's root
      expect($(".home_domain").attr("href")).toBe("http://" + window.location.href.split("/")[2]);
    }
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
  it("recovers key from localStorage", function() {

    // Save old values
    var oldURLs = ls.getItem("Message:URLs");
    var oldAppAddress = state.webApplicationURL;

    // Run test
    state.webApplicationURL = "https://priv.ly/test/show?fu=bar";
    ls.setItem("Message:URLs", [state.webApplicationURL + "#privlyLinkKey=testKey"]);
    expect(resolveKeyFromHistory()).toBe(true);

    // Try something more confusing
    ls.setItem("Message:URLs", ["AAA", "AAA",
     state.webApplicationURL + "#privlyLinkKey=testKey"]);
    expect(resolveKeyFromHistory()).toBe(true);

    // Cleanup
    ls.setItem("Message:URLs", oldURLs);
    state.webApplicationURL = oldAppAddress;
  });

  it("does not recover key from localStorage", function() {

    // Save old values
    var oldURLs = ls.getItem("Message:URLs");
    var oldAppAddress = state.webApplicationURL;

    // Run test
    state.webApplicationURL = "https://priv.ly/test/show?fu=bar";
    ls.setItem("Message:URLs", "#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(false);

    // Try something more confusing
    state.webApplicationURL = "https://test.com/fu/bar?fubar=hello_world";
    ls.setItem("Message:URLs", "||" +
     "https://faketest.com/fu/bar?fubar=hello_world#privlyLinkKey=testKey");
    expect(resolveKeyFromHistory()).toBe(false);

    // Cleanup
    ls.setItem("Message:URLs", oldURLs);
    state.webApplicationURL = oldAppAddress;
  });
});

