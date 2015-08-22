/**
 * @fileOverview first_run.js Gives testing code for the ChromeFirstRun
 * This spec is managed by the Jasmine testing library.
 **/

describe ("ChromeFirstRun Suite", function() {

  it("tests submitRegistration", function() {
    spyOn(privlyNetworkService, "sameOriginPostRequest").and.callFake(function(url, callback, data) {}); 
    callbacks.submitRegistration();
    expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled(); 
  });

  it("tests checkRegistration - successful registration", function() {
    var response = {
      json: {
        success: true,
        status: 200
      }
    };
    spyOn(callbacks, "pendingRegistration");
    spyOn(callbacks, "registrationFailure");
    callbacks.checkRegistration(response);
    expect(callbacks.pendingRegistration).toHaveBeenCalled();
    expect(callbacks.registrationFailure).not.toHaveBeenCalled();
  });

  it("tests checkRegistration - failed registration", function() {
    var response = {
      json: {
        success: false,
        status: 404
      }
    };
    spyOn(callbacks, "pendingRegistration");
    spyOn(callbacks, "registrationFailure");
    callbacks.checkRegistration(response);
    expect(callbacks.pendingRegistration).not.toHaveBeenCalled();
    expect(callbacks.registrationFailure).toHaveBeenCalled();
  });

});
