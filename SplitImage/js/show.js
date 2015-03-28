/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/


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
  state.key = privlyParameters.getParameterHash(url).privlyLinkKey;
  
  privlyNetworkService.permissions.canShow = true;
  
  var json = response.json;
  if( json === null ) return;
  
  if (state.key === undefined || state.key === "") {
    $('#clearimage').text("You do not have the key required to decrypt this content.");
    $("#loading-gif").hide();
    privlyNetworkService.permissions.canShow = false;
    privlyNetworkService.permissions.canUpdate = false;
    return;
  } else if(json.structured_content !== undefined) {
    var cleartext = zeroDecipher(pageKey(state.key), json.structured_content);
    var img = document.createElement('img');
    img.setAttribute("id", "clearimage");
    img.setAttribute("src", cleartext);
    img.setAttribute("title", "decrypted image");
    img.setAttribute("class","img-responsive");
    img.setAttribute("style","WIDTH: 100%; HEIGHT: 100%");
    $("#clearimage").replaceWith(img);
    $("#loading-gif").hide();
  } else {
    $('#clearimage').text("The data behind this link is destroyed or corrupted.");
    $("#loading-gif").hide();
    privlyNetworkService.permissions.canShow = false;
    privlyNetworkService.permissions.canUpdate = false; 
    return;
  }
}

/**
 * Replace the update handler so that we can ensure content will always be
 * encrypted before pusing updates to the remote server.
 * @param {event} evt The update button event triggered by the user.
 * @param {function} callback An ignored parameter since there is no
 * need to pass in a callback in this case.
 */
function encryptBeforeUpdate(evt, callback) {
  
  var cipherdata = zeroCipher(state.key + "=", $("#clearimage")[0].src);
  privlyNetworkService.sameOriginPutRequest(state.jsonURL, 
    function(response){
      callbacks.contentReturned(response, processResponseContent)},
    {post: {structured_content: cipherdata,
    seconds_until_burn: $( "#seconds_until_burn" ).val()}});
  
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
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") ) {
      initializeApplication();
    }
  }
);
