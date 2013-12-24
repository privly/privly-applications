/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app does not currently know whether it is logged
 *    in
 * 2. Not logged in: The app displayed the login form for the user.
 * 3. Login Failure: the user supplied incorrect credentials for logging
 *    into the remote server.
 * 4. Submit Credentials: Send the credentials to the remote server.
 * 5. Check Credentials: The credentials check has returned from the
 *    server and is being checked for acceptance.
 * 6. Login Failure: The server did not grant the user a session.
 * 7. Pending Post: The user is properly logged in and can create content.
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {
    
    // Display the content server the user is asssociated with
    $(".content_server").text(privlyNetworkService.contentServerDomain());
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Monitor the login button
    document.querySelector('#login').addEventListener('click', callbacks.submitCredentials);
    $("#user_password").keyup(function (e) {
        if (e.keyCode == 13) {
            callbacks.submitCredentials();
        }
    });
    
    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() { 
      $('#loadingDiv').hide(); 
    });
    
    // See if the user is currently logged in
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      callbacks.pendingPost, 
      callbacks.notLoggedIn, 
      callbacks.notLoggedIn);
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  notLoggedIn: function() {
    $("#messages").hide("slow");
    $("#form").show("slow");
  },
  
  /**
   * Submit the posting form and await the return of the post.
   */
  submitCredentials: function() {
    $("#save").prop('disabled', true);
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/users/sign_in", 
      callbacks.checkCredentials,
      {"user[email]":  $("#user_email").val(),
       "user[password]":  $("#user_password").val()
       });
  },
  
  
  /**
   * Send the URL to the extension or mobile device if it exists and display
   * it to the end user.
   */
  checkCredentials: function(response) {
    
    if ( response.json.success === true ) {
      callbacks.pendingPost();
    } else {
      callbacks.loginFailure();
    }
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  loginFailure: function() {
    $("#messages").text("Bad username or password");
    $("#messages").show("slow");
  },
  
  /**
   * Tell the user they can create their post by updating the UI.
   */
  pendingPost: function() {
    privlyNetworkService.showLoggedInNav();
    $("#messages").text("You are currently logged in to " + 
      privlyNetworkService.contentServerDomain());
    $("#messages").show("slow");
    $("#form").hide("slow");
    $("#currently_logged_in").show("slow");
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', callbacks.pendingLogin);
