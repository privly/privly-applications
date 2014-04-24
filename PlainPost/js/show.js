/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

/**
 * Application specific content type handler. This function
 * processes the markdown that should have been returned by
 * the server.
 *
 * @param {jqHR} response The response from the server for the associated
 * data URL.
 */
function processResponseContent(response) {
  var json = response.json;
  var serverMarkdown = null;
  
  // Handle old, non-standard content
  if( json === null ) {
    serverMarkdown = response.content;
  }
  
  // Assign the Markdown from the JSON
  if( typeof json.content === "string" ) {
    serverMarkdown = json.content;
  }

  if( serverMarkdown === null ) {
    $("#post_content").html("<p>Error: Unrecognized server type</p>");
  } else {
    var markdownHTML = markdown.toHTML(serverMarkdown);
    $("#edit_text").val(serverMarkdown);
    $("#post_content").html(markdownHTML);

    // Make all user-submitted links open a new window
    $('#post_content a').attr("target", "_blank");
  }
}

// Make the Tooltip display this App's name.
privlyTooltip.appName = "PlainPost";

// Initialize the application
document.addEventListener('DOMContentLoaded', 
  function(){callbacks.pendingContent(processResponseContent)});

