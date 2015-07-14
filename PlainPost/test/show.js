/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("PlainPost Show Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "logout_link",
      "home_domain",
      "content",
      "save",
      "update",
      "edit_text",
      "privlyHeightWrapper",
      "post_content"
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

    // Save the callbacks for restoration at the end of the test
    var oldSameOriginGetRequest = privlyNetworkService.initPrivlyService;
    privlyNetworkService.sameOriginGetRequest = function(){
      return {response: ""};
    };

    callbacks.pendingContent(processResponseContent);

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

    // Restore the get request function
    privlyNetworkService.sameOriginGetRequest = oldSameOriginGetRequest;
  });

  it("previews markdown", function() {
    var mkdwn = "# hello world";
    var editText = document.getElementById("edit_text");
    editText.value = mkdwn;
    previewMarkdown();
    expect($( "#post_content" ).html()).toBe("<h1>hello world</h1>");
  });

  it("processes response content", function() {
    expect($("#edit_text").val()).toBe("");
    expect($("#post_content").html()).toBe("");
    expect($("a[target='_blank']").length).toBe(0);
    var mkdwn = "[link](http://test.privly.org)";
    var response = {json: {content: mkdwn}};
    processResponseContent(response);
    expect($("#edit_text").val()).toBe(mkdwn);
    expect($("#post_content a")[0].getAttribute("target")).toBe("_blank");
    expect($("a[target='_blank']").length).toBe(1);
  });

});
