/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

var message;

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  var preview = document.getElementById("preview");
  var mkdwn = document.getElementById("content").value;
  preview.innerHTML = markdown.toHTML(mkdwn);
}

/**
 * Add the decryption key to the anchor of the URL.
 *
 * @param {jqxhr} response The response from the server containing the
 * URL that needs to be modified.
 * @param {string} randomkey The decryption key for the content held at the
 * server.
 * @param {string} The URL with the link key appended.
 */
function processURL(response) {
  var url = response.jqXHR.getResponseHeader("X-Privly-Url");
  return message.postprocessLink(url).then(function (url) {
    message.storeUrl(url);
    return url;
  });
}

/**
 * The user submitted the form so the content will be sent to the remote server.
 * This encrypts the content with a new random key before sending it to the
 * remote server.
 */
function save() {
  message = new Privly.app.Message();
  message.generateRandomKey();
  message
    .getRequestContent($("#content")[0].value)
    .then(function (content) {
      callbacks.postCompleted = function(response) {
        processURL(response).then(function (url) {
          oldPostCompletedCallback(response, url);
        });
      };
      // Submit the ciphertext to the server
      callbacks.postSubmit(content.structured_content, 
        "Message",
        $( "#seconds_until_burn" ).val(), 
        "");
    });
}

/**
 * Initialize the application.
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

  // Save the old callback so it can be referenced later
  oldPostCompletedCallback = callbacks.postCompleted;
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
