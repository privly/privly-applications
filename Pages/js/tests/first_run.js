/**
 * @fileOverview first_run.js Gives testing code for the ChromeFirstRun
 * This spec is managed by the Jasmine testing library.
 **/

describe ("ChromeFirstRun Suite", function() {

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

  it("initializes", function() {
    var backup = privlyNetworkService.initPrivlyService;
    privlyNetworkService.initPrivlyService = function(){};
    init();
    privlyNetworkService.initPrivlyService = backup;
  });

});
