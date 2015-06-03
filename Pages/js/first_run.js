/**
 * @fileOverview first_run.js shows the necessary navigation and
 * design elements to be integrated into the privly-applications
 * bundle.
 */

/**
 * Initialize the applications by showing and hiding the proper
 * elements.
 */
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

  // Show a preview of the tooltip to the user
  $("#tooltip").append(Privly.glyph.getGlyphDOM())
               .show()
               .append("<br/><br/><p>This is your Privly Glyph</p>");
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
