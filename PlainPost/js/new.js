/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  $( "#preview" ).html(markdown.toHTML($( "#content" ).val()));
}

/**
 * The user submitted the form so the content will be sent to the remote server.
 */
function save() {
  callbacks.postSubmit("", 
    "PlainPost", 
    $( "#seconds_until_burn" ).val(), 
    $("#content")[0].value);
}

/**
 * Initialize the application
 */
function initializeApplication() {
  
  // Generate the previewed content
  var contentElement = document.getElementById("content");
  contentElement.addEventListener('keyup', previewMarkdown);

  // Initialize the application
  callbacks.pendingLogin();

  // Monitor the submit button
  document.querySelector('#save').addEventListener('click', save);
  
  // Make all text areas auto resize to show all their contents
  $('textarea').autosize();
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
