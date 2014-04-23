/**
 * @fileOverview Manages the form interaction with remote servers.
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
   */
  pendingLogin: function() {

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

    // Generate the previewed content
    var contentElement = document.getElementById("content");
    contentElement.addEventListener('keyup', previewMarkdown);

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
    $("#messages").hide();
    $("#login_message").show();
    $("#refresh_link").click(function(){location.reload(true);});
  },

  /**
   * Tell the user they can create their post by updating the UI.
   */
  pendingPost: function() {

    privlyNetworkService.showLoggedInNav();

    // Monitor the submit button
    document.querySelector('#save').addEventListener('click', callbacks.postSubmit);
    $("#save").prop('disabled', false);
    $("#messages").toggle();
    $("#form").toggle();
  },

  /**
   * Submit the posting form and await the return of the post.
   */
  postSubmit: function() {
    $("#save").prop('disabled', true);
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts",
      callbacks.postCompleted,
      {"post":
        {"content": $("#content")[0].value,
         "privly_application":"PlainPost",
         "public":true,
         "seconds_until_burn": $( "#seconds_until_burn" ).val()},
         "format":"json"});
  },

  /**
   * Tell the user that there was a problem.
   */
  createError: function() {
    $("#save").prop('disabled', false);
    $("#messages").text("There was an error creating your post.");
  },

  /**
   * Send the URL to the extension or mobile device if it exists and display
   * it to the end user.
   */
  postCompleted: function(response) {
    $("#save").prop('disabled', false);
    var url = response.jqXHR.getResponseHeader("X-Privly-Url");
    if(url !== undefined && url !== "") {
      privlyExtension.firePrivlyURLEvent(url);
      $("#messages").text("Copy the address found below to any website you want to share this information through");
      $(".privlyUrl").text(url);
      $(".privlyUrl").attr("href", url);

      // Keep the user in local code if possible, but display the remote code link
      // so the user does not accidentally copy the local code url
      if ( privlyNetworkService.platformName() !== "HOSTED" ) {
        var localCodeURL = "show.html?privlyOriginalURL=" + encodeURIComponent(url);
        $('.privlyUrl').one('click', function (e) {this.href = localCodeURL;});
      }
      $("#messages").show();
    } else {
      callbacks.createError();
    }
  }
}

/**
 * Message handlers for integration with extension framworks.
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
   */
  messageSecret: function(data) {
    privlyExtension.messageExtension("initialContent", "");
  }

}

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  preview.innerHTML = markdown.toHTML(document.getElementById("content").value);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', callbacks.pendingLogin);
