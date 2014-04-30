/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  preview.innerHTML = markdown.toHTML(document.getElementById("content").value);
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
function processURL(response, randomkey) {
  if( response.jqXHR.status !== 201 ) {
    return "";
  }
  var url = response.jqXHR.getResponseHeader("X-Privly-Url");
  if( url.indexOf("#") > 0 ) {
    url = url.replace("#", "#privlyLinkKey="+randomkey);
  } else {
    url = url + "#privlyLinkKey=" + randomkey;
  }
  return url;
}

/**
 * The user submitted the form so the content will be sent to the remote server.
 * This encrypts the content with a new random key before sending it to the
 * remote server.
 */
function save() {
  var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
  var cipherdata = zeroCipher(randomkey, $("#content")[0].value);
  
  // Pre-process the URL once it is returned from the server
  var oldCallback = callbacks.postCompleted;
  callbacks.postCompleted = function(response) {
    oldCallback(response, processURL(response, randomkey));
  }
  
  // Submit the ciphertext to the server
  callbacks.postSubmit(cipherdata, 
    "ZeroBin", 
    $( "#seconds_until_burn" ).val(), 
    "", 
    processURL);
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
}

document.addEventListener('DOMContentLoaded', initializeApplication);
