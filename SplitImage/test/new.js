/**
 * @fileOverview new.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 

describe ("SplitImage New Suite", function() {
  
  var new_fixtures = [
    '<a class="home_domain">Privly</a>',
    '<a class="legal_nav">Legal</a>',
    '<a class="account_url">Account<a/>',
    '<a id="logout_link">Logout</a>',
    '<ul><li class="mobile_hide"></li></ul>',
    '<div id="drop_zone"></div>',
    '<input type="file" id="files" multiple />',
    '<button id="save"></button>'
  ]

  beforeEach(function() {
    for (var i=0; i<new_fixtures.length; i++) {
      document.body.innerHTML += new_fixtures[i];
    }
  });

  afterEach(function() {
    document.body.innerHTML = '';
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
});
