/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Help New Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "current_content_server",
      "remote_content_server",
      "messages",
      "login_message",
      "refresh_link",
      "form",
      "logout_link"
    ];
    domIDs.forEach(function(id){
      var newElement = $('<a/>', {
        id: id,
      });
      $(document.body).append(newElement);
    });
  });

  // Remove the expected DOM
  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("initializes properly", function() {

    // Save the callbacks for restoration at the end of the test
    var oldInit = privlyNetworkService.initPrivlyService;
    var oldInitNav = privlyNetworkService.initializeNavigation;
    privlyNetworkService.initPrivlyService = function(){};

    // Call the test
    callbacks.pendingLogin();

    expect(ls.getItem("Login:redirect_to_app")).toBe(window.location.href);
    expect($("#current_content_server").text()).toBe("localhost:9876");
    expect($("#remote_content_server").attr("href")).toBe("http://localhost:9876");

    // Restore the callback for the other tests
    privlyNetworkService.initPrivlyService = oldInit;
    privlyNetworkService.initializeNavigation = oldInitNav;
  });

  it("shows login failures", function() {
    spyOn(privlyNetworkService, "showLoggedOutNav");
    callbacks.loginFailure();

    // Visibility is defined differently on Chrome and Safari
    if(privlyNetworkService.platformName() === "FIREFOX") {
      expect($("#messages").is(':visible')).toBe(false);
      expect($("#login_message").is(':visible')).toBe(true);
    }
    expect(privlyNetworkService.showLoggedOutNav).toHaveBeenCalled();
  });

});
