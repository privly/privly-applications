/**
 * @fileOverview first_run.js shows the necessary navigation and
 * design elements to be integrated into the privly-applications
 * bundle.
 */

/**
 * Initialize the applications by showing and hiding the proper
 * elements.
 */
var callbacks = {

  /**
   * Submit the registration form and await the return of the registration.
   */
  submitRegistration: function() {
    $("#registerModal").modal('hide');
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/users/invitation",
      callbacks.checkRegistration,
      { "user[email]":  $("#register_email").val() });
  },

  /**
   * Check to see if the user's registration was accepted by the server.
   */
  checkRegistration: function(response) {
     if ( response.json.success === true ) {
      callbacks.pendingRegistration();
    } else {
      callbacks.registrationFailure();
    }
  },

  /**
   * Tell the user their registration was submitted.
   */
  pendingRegistration: function() {
    $("#messages").html("<strong>Thanks!</strong> If your email isn't already in our " +
      "database you should receive an email shortly.");
    $("#messages").show();
  },

  /**
   * Tell the user their registration was rejected.
   */
  registrationFailure: function() {
    $("#messages").html("<strong>Error</strong> communicating with registration server.");
    $("#messages").show();
  }

}
function init() {

  // Set the nav bar to the proper domain
  privlyNetworkService.initializeNavigation();

  privlyNetworkService.initPrivlyService(
    privlyNetworkService.contentServerDomain(),
    privlyNetworkService.showLoggedInNav,
    privlyNetworkService.showLoggedOutNav
  );

  $("#messages").hide();
  $("#form").show();
  $(".content_server").text(ls.getItem("posting_content_server_url").split("//")[1]);

  $("#registerForm").on("submit", function(e) {
    e.preventDefault();
    callbacks.submitRegistration();
  });
 
  // Show a preview of the tooltip to the user
  $("#tooltip").append(Privly.glyph.getGlyphDOM())
               .show()
               .append("<br/><br/><p>This is your Privly Glyph</p>");
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Don't start the script if it is running in a Headless
  // browser
  if( document.getElementById("logout_link") ) {
    init();
  }
});
