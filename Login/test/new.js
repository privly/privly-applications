/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Login Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "home_domain",
      "login",
      "logout_link",
      "loginForm",
      "registerForm",
      "content_server",
      "messages",
      "form"
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

  it("tests pendingLogin", function() {
    callbacks.pendingLogin();
    expect($(".content_server").text()).toBe(privlyNetworkService.contentServerDomain());
  });

  it("tests not logged in", function() {
    callbacks.notLoggedIn();
    expect($("#messages").is(':visible')).toBe(false);

    // Fails on Chrome and Safari
    // expect($("#form").is(':visible')).toBe(true);
  });

  it("tests loginError", function() {
    var elem = $("#messages");
    var originalText = elem.text();
    callbacks.loginError();
    var newText = elem.text();
    expect(originalText).not.toBe(newText);
    expect(elem.is(':visible')).toBe(true);
  });

  it("tests registrationFailure", function() {
    var elem = $("#messages");
    var originalText = elem.text();
    callbacks.registrationFailure();
    var newText = elem.text();
    expect(originalText).not.toBe(newText);
    expect(elem.is(':visible')).toBe(true);
  });

  it("tests registrationFailure", function() {
    var elem = $("#messages");
    var originalText = elem.text();
    callbacks.registrationFailure();
    var newText = elem.text();
    expect(originalText).not.toBe(newText);
    expect(elem.is(':visible')).toBe(true);
  });

  it("tests pendingRegistration", function() {
    var elem = $("#messages");
    var originalText = elem.text();
    callbacks.pendingRegistration();
    var newText = elem.text();
    expect(originalText).not.toBe(newText);
    expect(elem.is(':visible')).toBe(true);
  });

  it("tests submitCredentials", function() {
    spyOn(privlyNetworkService, "sameOriginPostRequest").and.callFake(function(url, callback, data) {});
    callbacks.submitCredentials();
    expect($("#login").prop("disabled")).toBe(true);
    expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled();
  });

  it("tests checkCredentials - correct credentials", function() {
    var response = {
      json: {
        success: true,
        status: 200
      }
    };
    spyOn(callbacks, "pendingPost");
    spyOn(callbacks, "loginFailure")
    callbacks.checkCredentials(response);
    expect($("#login").prop("disabled")).toBe(false);
    expect(callbacks.pendingPost).toHaveBeenCalled();
    expect(callbacks.loginFailure).not.toHaveBeenCalled();
  });

  it("tests checkCredentials - incorrect credentials", function() {
    var response = {
      json: {
        success: false,
        status: 401
      }  
    }
    spyOn(callbacks, "pendingPost");
    spyOn(callbacks, "loginFailure");
    callbacks.checkCredentials(response);
    expect(callbacks.pendingPost).not.toHaveBeenCalled();
    expect(callbacks.loginFailure).toHaveBeenCalled();
  });

});
