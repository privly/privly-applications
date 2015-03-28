/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory. The modifications for this app include
 * processing image URLs through the ZeroBin style encryption.
 **/

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
 *
 * @param {string} imageURL the encoded image data. This is encoded as an
 * HTML5 data url.
 */
function save(imageURL) {
  var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
  var cipherdata = zeroCipher(randomkey, imageURL);
  
  // Pre-process the URL once it is returned from the server
  var oldCallback = callbacks.postCompleted;
  callbacks.postCompleted = function(response) {
    oldCallback(response, processURL(response, randomkey));
  }
  
  // Submit the ciphertext to the server
  callbacks.postSubmit(cipherdata, 
    "SplitImage",                    //App name
    $( "#seconds_until_burn" ).val(),//Post lifetime
    "",                              //Deprecated
    processURL);                     //Callback
}

/**
 * Initialize the application.
 */
function initializeApplication() {
  
  // Add event listerner on hidden input field
  document.getElementById('files').addEventListener('change', 
    handleFileSelect, false);

  // Handle drag and drop
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', function(evt){
    handleFileSelect(evt);
    $("#preview_area").show();
    $("#drop_zone").hide();
  }, false);
  
  // Monitor the submit button
  document.querySelector('#save').addEventListener('click', function(){save($("#clearimage")[0].src)});
  
  // Initialize the application
  callbacks.pendingLogin();
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
