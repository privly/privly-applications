/**
 * @fileOverview This is the controller part for the
 * `show` use-case of the SplitImage App. To learn more
 * about the MVC architecture of a Privly Application,
 * see SplitImage/js/splitimageApp.js and SplitImage/js/new.js.
 *
 * The `show` view is being refactored to more closely
 * match the MVC style of the `new` view.
 * So the "controller" here for the `show` action is
 * quite different from other controllers.
 *
 * In the new Privly application architecture,
 * there are three MVC parts (model, view, controller), but in
 * the former architecutre there were only views and controllers.
 */
var SplitImage;

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

  SplitImage = new Privly.app.model.SplitImage();
  SplitImage
    .loadRawContent(url, json)
    .then(function (clearimage) {

      // Change the edit button back to the default style
      // if it has been modified. This is usually for
      // when the user has edited content and submitted
      // the form.
      $( "#update" ).attr("class", "btn btn-default");

      privlyNetworkService.permissions.canShow = true;
      var img = document.createElement('img');
      img.setAttribute("id", "clearimage");
      img.setAttribute("src", clearimage);
      img.setAttribute("title", "decrypted image");
      img.setAttribute("class","img-responsive");
      img.setAttribute("style","WIDTH: 100%; HEIGHT: 100%");
      $("#clearimage").replaceWith(img);
      $("#loading-gif").hide();
    }, function (rejectReason) {
      $('output#clearimage').text(rejectReason);
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
  SplitImage
    .getRequestContent($("#clearimage")[0].src)
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
  privlyTooltip.appName = "SplitImage";

  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
  
  // Start the app
  callbacks.pendingContent(processResponseContent);

  // Replace the update function so we never send the cleartext server side.
  callbacks.update = encryptBeforeUpdate;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApplication);
