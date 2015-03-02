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
    $("#register_feedback").html("<strong>Thanks!</strong> You should receive an email soon!");
    $("#register_feedback").show();
    $("#registration-form").delay( 1500 ).animate({"margin-top": "-140px", }, 800);
  },

  /**
   * Tell the user their registration was rejected.
   */
  registrationFailure: function() {
    $("#register_feedback").text("<strong>Error</strong> communicating with registration server.");
    $("#register_feedback").show();
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
  $("#registration-form").hide();
  $("#content_server_btn").text(ls.getItem("posting_content_server_url").split("//")[1]);

  document.querySelector("#registration").addEventListener('click', function(){
    $("#registration-form").show();
  });

  document.querySelector("#register_btn").addEventListener('click', callbacks.submitRegistration);

  // Show a preview of the tooltip to the user
  var glyphHTML = privlyTooltip.glyphHTML();
  $("#tooltip").html(glyphHTML)
               .show()
               .append("<br/><br/><p>This is your Privly Glyph</p>");
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
