/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Message Show Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      {label: "logout_link", tag: "a"},
      {label: "home_domain", tag: "a"},
      {label: "content", tag: "div"},
      {label: "save", tag: "a"},
      {label: "update", tag: "a"},
      {label: "edit_text", tag: "textarea"},
      {label: "privlyHeightWrapper", tag: "div"},
      {label: "post_content", tag: "div"},
      {label: "cleartext", tag: "div"},
      {label: "edit_form", tag: "div"}
    ];
    domIDs.forEach(function(ob){
      var newElement = $('<' + ob.tag + '/>', {
        id: ob.label,
        "class": ob.label
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

    // Restore the get request function
    privlyNetworkService.sameOriginGetRequest = oldSameOriginGetRequest;
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

  it("previews markdown", function() {
    var mkdwn = "# hello world";
    var editText = document.getElementById("edit_text");
    editText.value = mkdwn;
    previewMarkdown();
    expect($( "#post_content" ).html()).toBe("<h1>hello world</h1>");
  });

  it("processes response content", function() {
    expect($("#edit_text").val()).toBe("");
    expect($("div#cleartext").html()).toBe("");
    expect($("a[target='_blank']").length).toBe(0);
    var mkdwn = "[link](http://test.privly.org)";
    var response = {json:
      {"burn_after_date":"2015-06-20T16:23:11Z",
       "content":"","created_at":"2015-06-19T16:23:11Z",
       "id":2753,
       "privly_application":"Message",
       "public":true,
       "random_token":"1532f280ec",
       "structured_content":
         "{\"iv\":\"WXjGNCC58mUL8B9pCFcAPA==\",\"v\":1,\"iter\":1000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"AlNCKZz/nf8=\",\"ct\":\"wHnUBH3xPsVXb94w04Ss+CO/E0xGkDlWoZzzZ32BcbO4QqbZ5tZSDDyKIKvL5Qw3ehXP6A==\"}",
       "updated_at":"2015-06-19T16:23:11Z",
       "user_id":4,
       "rendered_markdown":"\n",
       "X-Privly-Url":"https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1532f280ec&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F2753.json%3Frandom_token%3D1532f280ec",
       "permissions":{"canshow":true,"canupdate":true,"candestroy":true,"canshare":true}}};

    state.webApplicationURL = "https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1532f280ec&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F2753.json%3Frandom_token%3D1532f280ec#privlyLinkKey=GMvZYPcobEY2ECzrmXIuDisb7FUo19IKyHCQfNoppno%3D";

    processResponseContent(response);
    expect($("#edit_text").val()).toBe(mkdwn);
    expect($("div#cleartext > p > a")[0].getAttribute("target")).toBe("_blank");
    expect($("a[target='_blank']").length).toBe(1);
  });

  it("can encrypt before update", function() {
    var evt = {stopPropagation: function(){}};
    state.key = "GMvZYPcobEY2ECzrmXIuDisb7FUo19IKyHCQfNoppno=";
    privlyNetworkService.sameOriginPutRequest = function(url, callback, data){
      expect(url).toBe(document.location.href);
      expect(data.post.structured_content.length).toBe(165);
    };
    $("#edit_text")[0].value = "changed";
    encryptBeforeUpdate(evt, function(){});
  });

});
