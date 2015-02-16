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
 * processes the markdown that should have been returned by
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
  
  var json = response.json;
  var serverMarkdown = null;
  
  // Handle old, non-standard content
  if( json === null ) {
    serverMarkdown = response.content;
  }
  
  // Assign the Markdown from the JSON
  if( typeof json.content === "string" ) {
    serverMarkdown = json.content;
  } else {
    serverMarkdown = "";
  }

  var markdownHTML = markdown.toHTML(serverMarkdown);
  $("#edit_text").val(serverMarkdown);
  $("#post_content").html(markdownHTML);

  // Make all user-submitted links open a new window
  $('#post_content a').attr("target", "_blank");

  // Generate the previewed content
  $("#edit_text").bind("keyup", previewMarkdown);

  // Make all text areas auto resize to show all their contents
  if ( ! privlyHostPage.isInjected() ) {
    $('textarea').autosize();
  }
  privlyHostPage.resizeToWrapper();
}

// Make the Tooltip display this App's name.
privlyTooltip.appName = "PlainPost";


// Initialize the application
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") ) {
      callbacks.pendingContent(processResponseContent);
    }
  }
);
