/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Login Suite", function() {

  beforeEach(function() {
    var loginBtn = document.createElement("BUTTON");
    loginBtn.setAttribute("id", "login");
    document.body.appendChild(loginBtn);
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
