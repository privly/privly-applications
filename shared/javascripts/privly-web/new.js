/**
 * @fileOverview This is a general adapter for interfacing with the Privly-web
 * server: github.com/privly/privly-web
 *
 * Its purpose is to allow all privly-web derived applications to interface
 * with privly-web through a consistent adapter, thereby speeding updates
 * and easing the generation of a large number of applications.
 *
 * It manages the general flow of an application that interfaces with the 
 * privly-web server but it is intended to be extended as necessary by
 * individual privly-applications. For example, see new.js in the PlainPost
 * Privly Application.
 *
 * ## Expected Elements ##
 * This adapter expects the DOM to have a set of elements
 *
 * '#loadingDiv': This will be shown whenever an AJAX request is pending
 * '#messages': This shows UI messages to the user.
 * '#login_message': This shows a login error message to the user.
 * '#save': This is the submit button for the form.
 * '#form': This is the form the user enters content into.
 * '.privlyUrl': The text with the Privly-type URLs.
 * '#content")[0]': The content area that accepts user text.
 *
 * ## Extending this script ##
 * Each of these functions have callbacks that will be called at the
 * end of the function, if the callback is defined.
 * If you need to modify the inputs to these callbacks or to perform an 
 * action before the callback is executed, we recommend you overwrite the
 * callback with a new callback that calls the original callback with the
 * modified parameters. For example:
 *
 * var oldCallback = callbacks.postCompleted;
 * callbacks.postCompleted = function(response) {
 *   oldCallback(response, "modified");
 * }
 *
 **/

/**
 * The callbacks assign the state of the application.
 *
 * These applications can be placed into the following states:
 * 1. Pending Login Check: The app is currently requesting the CSRF
 *    token from the remote server. Callback=pendingLogin
 * 2. Failure to login: The user is not currently authenticated with the
 *    remote server. In this state the user is prompted to login.
 *    Callback=loginFailure
 * 3. Pending post: The user can make the post at this point.
 *    Callback=pendingPost
 * 4. postSubmit: The user submitted the form so the content is being
 *    sent to the remote server. Once it is returned, the URL will
 *    be messaged to the extension (if present) by calling the
 *    "postCompleted" callback.
 * 5. Error creating post: The remote server would not accept the user's
 *    content. The app should display an error message.
 *    Callback=createError
 * 6. Completed post: The remote server has returned a URL. This app should
 *    display it and fire the URL event.
 *    Callback=postCompleted
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   *
   * @param {function} callback A function to call after the content
   * returns from the server.
   */
  pendingLogin: function(callback) {

    ls.setItem("Login:redirect_to_app", window.location.href);

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Initialize message pathway to the extension.
    messaging.initialize();
    
    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() { 
      $('#loadingDiv').hide(); 
    });
    
    // Pass the callback forward
    function wrapPendingPost() {
      callbacks.pendingPost(callback);
    }
    function wrapLoginFailure() {
      callbacks.loginFailure(callback);
    }
    
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      wrapPendingPost, 
      wrapLoginFailure, 
      wrapLoginFailure);
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   *
   * @param {function} callback A function to call after the UI updates
   * to tell the user they are not logged in.
   */
  loginFailure: function(callback) {
    
    privlyNetworkService.showLoggedOutNav();
    
    $("#messages").hide();
    $("#login_message").show();
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * Tell the user they can create their post by updating the UI.
   *
   * @param {function} callback A function to call after the login check
   * was successfull.
   */
  pendingPost: function(callback) {
    
    privlyNetworkService.showLoggedInNav();
    
    // Monitor the submit button
    $("#save").prop('disabled', false);
    $("#messages").toggle();
    $("#form").toggle();

    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * Submit the posting form and await the return of the post.
   *
   * @param {json} structured_content The JSON the application
   * needs to store.
   * @param {string} privly_application The name of the Privly application
   * generating the content.
   * @param {int} seconds_until_burn The number of seconds until this
   * content should be destroyed by the server.
   * @param {string} content A markdown string. This will likely
   * be deprecated in the future.
   * @param {function} callback A function to call after the content
   * returns from the server. If this is not specificed then the
   * default is the postCompleted callback.
   */
  postSubmit: function(structured_content, privly_application,
    seconds_until_burn, content, callback) {
    
    function wrapCallback(response) {
      var url = response.jqXHR.getResponseHeader("X-Privly-Url");
      callbacks.postCompleted(response, url, callback);
    }
    
    $("#save").prop('disabled', true);
    
    var contentToPost = {post:
      {"content": content,
       "structured_content": structured_content,
       "privly_application":privly_application,
       "seconds_until_burn": seconds_until_burn,
       "public":true},
      "format":"json"};
    
    // Send the post
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts", 
      wrapCallback,
      contentToPost);
  },
  
  /**
   * Tell the user that there was a problem.
   *
   * @param {jqhr} response The AJAX response from the server.
   * @param {function} callback The function to call after createError
   * completes.
   */
  createError: function(response, callback) {
    $("#save").prop('disabled', false);
    $("#messages").text(
      "There was an error creating your post. Status: " +
      response.jqXHR.status);
    $("#messages").show();
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * Send the URL to the extension or mobile device if it exists and display
   * it to the end user.
   *
   * @param {jqhr} response The AJAX response from the server.
   * @param {string} url The injectable URL for the Privly Application.
   * @param {function} callback The function to call when this function
   * completes.
   */
  postCompleted: function(response, url, callback) {
    
    $("#save").prop('disabled', false);
    
    if(response.jqXHR.status === 201 && url !== undefined && url !== "") {
      privlyExtension.firePrivlyURLEvent(url);

      $("#copy_message").show();

      $('#local_address').attr("href", url);
      if ( privlyNetworkService.platformName() !== "HOSTED" ) {
        var localCodeURL = "show.html?privlyOriginalURL=" + encodeURIComponent(url);
        $('#local_address').attr("href", localCodeURL);
      }

      $(".privlyUrl").text(url);
      $(".privlyUrl").css("cursor", "pointer");
      $(".privlyUrl").click(function() {
        var range, selection;

        if (window.getSelection && document.createRange) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents($(this)[0]);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (document.selection && document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText($(this)[0]);
            range.select();
        }
        $(".open-app-button").show();
      });

      if(callbacks.functionExists(callback)) {
        callback();
      }
    } else {
      callbacks.createError(response, callback);
    }
  },
  
  /**
   * Determines whether a callback is defined.
   *
   * @param {function} callback Potentially a function.
   * @return {boolean} True if the parameter is a function, else false
   */
  functionExists: function(callback) {
    if (typeof callback == 'function') { 
      return true;
    }
    return false;
  }
}

/**
 * Message handlers for integration with extension frameworks.
 */
var messaging = {
  
  /**
   * Attach the message listeners to the interface between the extension
   * and the injectable application.
   */
  initialize: function() {
      privlyExtension.initialContent = messaging.initialContent;
      privlyExtension.messageSecret = messaging.messageSecret;
      
      // Initialize message pathway to the extension.
      privlyExtension.firePrivlyMessageSecretEvent();
  },
  
  /**
   * Listener for the initial content that should be dropped into the form.
   * This may be sent by a browser extension.
   *
   * @param {json} data A json document containing the initial content for
   * the form.
   */
  initialContent: function(data) {
    $("#content")[0].value = data.initialContent;
  },

  /**
   * Request the initial content from the extension. This callback is executed
   * after the extension successfully messages the secret message back to the
   * application.
   *
   * @param {json} data A json document that is ignored by this function.
   *
   */
  messageSecret: function(data) {
    privlyExtension.messageExtension("initialContent", "");
  }
}
