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
 * 7. Login Error: The server could not be reached or had an internal error.
 * 8. Pending Post: The user is properly logged in and can create content.
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {
    
    // Get the domain the user's extension is paired with
    var domain = privlyNetworkService.contentServerDomain();
    
    // Display the content server the user is asssociated with
    $(".content_server").text(domain);
    
    // Set the domain to the proper content server
    $(".login_issue").each( function( key, value ) {
      $(value).attr("href", domain + $(value).attr("data-path-sub"))
    });
    
    privlyNetworkService.showLoggedOutNav();
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Monitor the login button
    document.querySelector('#login').addEventListener('click', callbacks.submitCredentials);
    document.querySelector('#register').addEventListener('click', callbacks.submitRegistration);
    $("#user_password").keyup(function (e) {
        if (e.keyCode == 13) {
            callbacks.submitCredentials();
        }
    });

    $('#register_email').keyup(function (e) {
        if (e.keyCode == 13) {
            callbacks.submitRegistration();
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
      callbacks.loginError);
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  notLoggedIn: function() {
    $("#messages").hide();
    $("#form").show();
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
   * Submit the registration form and await the return of the registration.
   */
  submitRegistration: function() {
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/users/invitation", 
      callbacks.checkRegistration,
      { "user[email]":  $("#register_email").val() });
  },

  /**
   * Check to see if the user's credentials were accepted by the server.
   */
  checkCredentials: function(response) {
    
    if ( response.json.success === true ) {
      callbacks.pendingPost();
    } else {
      callbacks.loginFailure();
    }
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
   * Tell the user their credentials were rejected.
   */
  loginFailure: function() {
    $("#messages").text("Bad username or password. " + 
      "Too many failed attempts will lock the account.");
    $("#messages").show();
  },
  
  /**
   * Tell the user their content server could not be reached.
   */
  loginError: function() {
    $("#messages").text("Your content server is unavailable.");
    $("#messages").show();
  },

  /**
   * Tell the user their registration was rejected.
   */
  registrationFailure: function() {
    $("#messages").text("Failed to submit to registration server.");
    $("#messages").show();
  },
  
  /**
   * Tell the user their registration was submitted.
   */
  pendingRegistration: function() {
    $("#messages").text("Thanks! If your email isn't already in our " + 
      "database you should receive an email shortly.");
    $("#messages").show();
  },
  
  /**
   * Tell the user they are now logged in to the server.
   */
  pendingPost: function() {
    
    // get from local storage the last known app to redirect to
    if(ls.getItem("Login:redirect_to_app") !== undefined &&
       ls.getItem("Login:redirect_to_app").indexOf("Login") < 0) {
      window.location = ls.getItem("Login:redirect_to_app");
    } else {
      window.location = "../Help/new.html";
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") )
      callbacks.pendingLogin();
  }
);
