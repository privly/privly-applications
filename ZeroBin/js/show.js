/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

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
  state.key = privlyParameters.getParameterHash(url).privlyLinkKey;
  
  privlyNetworkService.permissions.canShow = true;
  
  var json = response.json;
  if( json === null ) return;
  
  if (state.key === undefined || state.key === "") {
    $('div#cleartext').text("You do not have the key required to decrypt this content.");
    return;
  } else if(json.structured_content !== undefined) {
    var cleartext = zeroDecipher(pageKey(state.key), json.structured_content);
    $("#edit_text").val(cleartext);
    var markdownHTML = markdown.toHTML(cleartext);
    $('div#cleartext').html(markdownHTML);
    
    // Make all text areas auto resize to show all their contents
    if ( ! privlyHostPage.isInjected() ) {
      $('textarea').autosize();
    }
  } else {
    $('div#cleartext').text("The data behind this link is destroyed or corrupted.");
  }
  privlyHostPage.resizeToWrapper();
}

/**
 * Replace the update handler so that we can ensure content will always be
 * encrypted before pusing updates to the remote server.
 * @param {event} evt The update button event triggered by the user.
 * @param {function} callback An ignored parameter since there is no
 * need to pass in a callback in this case.
 */
function encryptBeforeUpdate(evt, callback) {
  var cipherdata = zeroCipher(state.key + "=", $("#edit_text")[0].value);
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

document.addEventListener('DOMContentLoaded', 
  function(){$( "#edit_text" ).bind("keyup", previewMarkdown);}
);


// Make the Tooltip display this App's name.
privlyTooltip.appName = "ZeroBin";

// Initialize the application
document.addEventListener('DOMContentLoaded', 
  function(){callbacks.pendingContent(processResponseContent)});

// Replace the update function so we never send the cleartext server side.
callbacks.update = encryptBeforeUpdate;
