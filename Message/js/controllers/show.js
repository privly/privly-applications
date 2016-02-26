/**
 * @fileOverview This is the controller part for the
 * `show` use-case of the Message App. To learn more
 * about the MVC architecture of a Privly Application,
 * see Message/js/messageApp.js and Message/js/new.js.
 *
 * Currently the `show` view is under refactoring.
 * So the "controller" here for the `show` action is
 * quite different from other controllers. It is still
 * arranged in a former way, but only added a few lines
 * in order to reuse the interfaces in the model.
 *
 * The difference between the new App architecture and
 * the former:
 *
 *    In the new Privly application architecture,
 *    there are three parts, MVC. However in the former
 *    architecutre, there are only views and controllers.
 */
var message;

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  $( "#post_content" ).html(markdown.toHTML($( "#edit_text" ).val()));
  $( "#update" ).attr("class", "btn btn-warning");
  privlyHostPage.resizeToWrapper();
}

/**
 * Application specific content type handler. This function
 * processes the encrypted markdown that should have been returned by
 * the server.
 *
 * @param {jqHR} response The response from the server for the associated
 * data URL.
 */
function processResponseContent(response) {
  
  // Change the edit button back to the default style
  // if it has been modified. This is usually for
  // when the user has edited content and submitted
  // the form.
  $( "#update" ).attr("class", "btn btn-default");
  
  var url = state.webApplicationURL;
  
  privlyNetworkService.permissions.canShow = true;

  var json = response.json;
  if( json === null ) {return;}

  if(json.structured_content === undefined) {
    $('div#cleartext').text("The data behind this link is destroyed or corrupted.");
    privlyHostPage.resizeToWrapper();
    return;
  }

  message = new Privly.app.model.Message();
  message
    .loadRawContent(url, json)
    .then(function (cleartext) {
      $("#edit_text").val(cleartext);
      var markdownHTML = markdown.toHTML(cleartext);
      $('div#cleartext').html(markdownHTML);
      // Make all user-submitted links open a new window
      $('div#cleartext a').attr("target", "_blank");

      // Make all text areas auto resize to show all their contents
      if ( ! privlyHostPage.isInjected() ) {
        $('textarea').autosize();
      }
    }, function (rejectReason) {
      $('div#cleartext').text(rejectReason);
    })
    .then(function () {
      privlyHostPage.resizeToWrapper();
    });
}

/**
 * Replace the update handler so that we can ensure content will always be
 * encrypted before pusing updates to the remote server.
 * @param {event} evt The update button event triggered by the user.
 * @param {function} callback An ignored parameter since there is no
 * need to pass in a callback in this case.
 */
function encryptBeforeUpdate(evt, callback) {
  message
    .getRequestContent($("#edit_text")[0].value)
    .then(function (json) {
      privlyNetworkService.sameOriginPutRequest(state.jsonURL, 
        function(response){
          callbacks.contentReturned(response, processResponseContent);
        },
        {post: {structured_content: json.structured_content,
        seconds_until_burn: $( "#seconds_until_burn" ).val()}});
    });

  // needed to stop click event from propagating to body
  // and prevent a new window from opening because of click listener
  // on body.
  evt.stopPropagation();
  
  // Close the editing form
  $("#edit_form").hide();
  state.isInlineEdit = false;
}


function initializeApplication() {

  // Make the Tooltip display this App's name.
  privlyTooltip.appName = "Message";

  $( "#edit_text" ).bind("keyup", previewMarkdown);

  callbacks.pendingContent(processResponseContent);

  // Replace the update function so we never send the cleartext server side.
  callbacks.update = encryptBeforeUpdate;
}

// Initialize the application
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") ) {
      initializeApplication();
    }
  }
);
