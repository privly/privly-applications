/**
 * @fileOverview Checks whether the user is logged in.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app is currently requesting the CSRF
 *    token from the remote server. Callback=pendingLogin
 * 2. Failure to login: The user is not currently authenticated with the
 *    remote server. In this state the user is prompted to login.
 *    Callback=loginFailure
 * 3. Pending post: The user can make the post at this point.
 *    Callback=pendingPost
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {

    // Save to local storage the app to redirect to after succesful log in
    ls.setItem("Login:redirect_to_app", window.location.href);

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();

    var domain = privlyNetworkService.contentServerDomain();
    $("#current_content_server").text(domain.split("/")[2]);
    $("#remote_content_server").attr("href", domain);

    if ( privlyNetworkService.platformName() === "CHROME" ) {
      $(".chrome_options_link").show();
    }

    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() {
      $('#loadingDiv').hide();
    });

    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      callbacks.pendingPost,
      callbacks.loginFailure, 
      callbacks.loginFailure);
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  loginFailure: function() {
    privlyNetworkService.showLoggedOutNav();
    $("#messages").hide();
    $("#login_message").show();
    $("#refresh_link").click(function(){location.reload(true);});

    if ( window.location.href.indexOf("content_server") > 0 ) {
      $("#form").show();
    }

  },
  
  /**
   * Tell the user they can create their post by updating the UI.
   */
  pendingPost: function() {
    privlyNetworkService.showLoggedInNav();
    $("#messages").hide();
    $("#form").show();
  }
  
};

// Initialize the application
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") ) {
      callbacks.pendingLogin();
    }
  }
);
