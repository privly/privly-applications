/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Message New Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "logout_link",
      "home_domain",
      "content",
      "save",
      "preview"
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

  it("previews markdown", function() {
    var mkdwn = "# hello world";
    var preview = document.getElementById("preview");
    document.getElementById("content").value = mkdwn;
    previewMarkdown();
    expect(preview.innerHTML).toBe("<h1>hello world</h1>");
  });

  it("processesURL", function() {

    ls.removeItem("Message:URLs");
    var mkdwn = "# hello world";
    var preview = document.getElementById("preview");
    document.getElementById("content").value = mkdwn;
    var response = {
      jqXHR: {status: 200}
    };
    var randomKey = "kjflksjflakjfs=";
    expect(processURL(response, randomKey)).toBe("");

    response.jqXHR.status = 201;
    response.jqXHR.getResponseHeader = function() {
      return "http://dev.privly.org/lksdjfslkfjd";
    };
    expect(processURL(response, randomKey)).toBe(
      "http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D");

    privlyNetworkService.platformName = function() {
      return "NOT HOSTED";
    }
    processURL(response, randomKey);
    expect(ls.getItem("Message:URLs")[0]).toBe(
      'http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D');

    processURL(response, randomKey);
    expect(ls.getItem("Message:URLs")[1]).toBe(
      'http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D');
  });

  it("save does not result in an error", function() {
    $("#content")[0].value = "# hello world";
    callbacks.postSubmit = function(){}; // Eliminate the integration
    save();
  });

});

