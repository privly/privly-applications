/**
 * @fileOverview Gives testing code for the network_service.js shared library.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Network Service Test Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "logged_in_nav",
      "logged_out_nav",
      "logout_link",
      "home_domain",
      "login_url",
      "account_url",
      "legal_nav"
    ];
    domIDs.forEach(function(id){
      var newElement = $('<a/>', {
        id: id,
        "class": id
      });
      $(document.body).append(newElement);
    });
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("does not result in an error", function() {
    privlyNetworkService.permissions.canCreate =
    privlyNetworkService.permissions.canCreate;
    privlyNetworkService.platformName();
    privlyNetworkService.getProtocolAndDomain();
    privlyNetworkService.contentServerDomain();
  });

  it("sets the auth token string", function() {
    privlyNetworkService.setAuthTokenString("aaaa");
    expect(privlyNetworkService.authToken).toBe("auth_token=aaaa");
  });

  it("gets an auth tokenized url", function() {
    privlyNetworkService.setAuthTokenString("aaaa");
    var domain = privlyNetworkService.contentServerDomain();
    var expectationPairs = [
      ["/pages/1?blam=wam", "/pages/1?auth_token=aaaa&blam=wam"],
      ["/pages/1?blam=wam#thanks", "/pages/1?auth_token=aaaa&blam=wam#thanks"],
      ["/pages/1#thanks", "/pages/1?auth_token=aaaa#thanks"],
      ["/pages/1#blam=wam", "/pages/1?auth_token=aaaa#blam=wam"]
    ]
    expectationPairs.forEach(function(pair){
      expect(
        privlyNetworkService.getAuthenticatedUrl(domain + pair[0]))
          .toBe(domain + pair[1]);
    });
  });

  it("does not change url", function() {

    // The urls should not change because the auth token is not set for them

    privlyNetworkService.setAuthTokenString("aaaa");
    var authenticatedUrls = [
      "https://fake.priv.ly/pages/1?blam=wam",
      "https://fake.localhost:3000/pages/1?blam=wam#thanks",
      "https://fake.priv.ly/pages/1#thanks",
    ];
    authenticatedUrls.forEach(function(d){
      expect(
        privlyNetworkService.getAuthenticatedUrl(d))
          .toBe(d);
    });
  });

  it("has the complete default whitelist", function() {
    var whitelisted = [
      "https://priv.ly",
      "https://privlyalpha.org",
      "https://privlybeta.org",
      "http://localhost:3000",
      "https://dev.privly.org/"
    ];
    whitelisted.forEach(function(d){
        expect(
          privlyNetworkService.isWhitelistedDomain(d))
            .toBe(true);
    });
    privlyNetworkService.platformName = function(){return "CHROME"};
    whitelisted.forEach(function(d){
      expect(
        privlyNetworkService.isWhitelistedDomain(d))
        .toBe(true);
      });
    privlyNetworkService.platformName = function(){return "HOSTED"};
  });

  it("does not whitelist trick domains", function() {

    var domains = [
      "https://priv.ly.com",
      "howdyhttps://privlyalpha.org",
      "https://wam.privlybeta.org",
      "http://localhost:666",
      "https://newyork/"
    ];

    // It defaults to the hosted platform, in which everything is whitelisted
    domains.forEach(function(d){
      expect(
         privlyNetworkService.isWhitelistedDomain(d))
           .toBe(true);
    });

    privlyNetworkService.platformName = function(){return "CHROME"};

    // It defaults to the hosted platform, in which everything is whitelisted
    domains.forEach(function(d){
      expect(
        privlyNetworkService.isWhitelistedDomain(d))
          .toBe(false);
    });

    privlyNetworkService.platformName = function(){return "HOSTED"};
  });

  it("does not error", function() {
    privlyNetworkService.showLoggedInNav();
  });
 
  it("shows the logged out nav", function() {
    var tmp = privlyHostPage;
    privlyHostPage = undefined;
    privlyNetworkService.showLoggedOutNav();
    // Doesn't currently work as a test
    //expect($(".logged_in_nav").is(':visible')).not.toBe(true);
    //expect($(".logged_out_nav").is(':visible')).toBe(true);
    privlyHostPage = tmp;
  });
 
  it("hides some elements on mobile", function() {
    if( privlyNetworkService.platformName() === "IOS" ||
        privlyNetworkService.platformName() === "ANDROID" ) {
      expect($(".mobile_hide").is(':hidden')).toBe(true);
    }
  });

  it("initializes navigation", function() {
    privlyNetworkService.initializeNavigation();
    var domain = privlyNetworkService.contentServerDomain();
    expect($(".home_domain").attr("href")).toBe(domain);
    expect($(".home_domain").text()).toBe(domain.split("/")[2]);
    expect($(".account_url").attr("href")).toBe(domain + "/pages/account");
    expect($(".legal_nav").attr("href")).toBe(domain + "/pages/privacy");
  });

});
