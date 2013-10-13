/**
 * @fileOverview
 * This JavaScript acts as the driver for the PlainPost injectable application.
 * It defines the behavior specifc to this application. At a minimum the app
 * must start the tooltip. Without the supporting shared files found in the 
 * shared directory, this script is useless.
 **/

/**
 * Defines what the user is permissioned to do on the content.
 * This object is assigned when the content is fetched by AJAX request.
 */
var permissions = {
 canshow: true, 
 canupdate: false, 
 candestroy: false,
 canshare: false
};

/**
 * The parameters as parsed by the parameter script.
 */
var parameters = {};

/**
 * The URL of the application when accessed via the remote server. This
 * parameter is usually assigned by the extension since the original URL
 * is replaced by one served from the extension.
 */
var webApplicationURL = "";

/**
 * The URL of the data endpoint for this application.
 */
var jsonURL = "";

/**
 * Opens the injected content in a new window. If the user clicked a link
 * in the injected content, the link is followed in the current window.
 */
function singleClick(evt) {
  if(evt.target.nodeName == "A" && evt.target.href !== ""){
    parent.window.location = evt.target.href;
  } else {
    window.open(webApplicationURL, '_blank');
  }
};

/**
 * Takes the ciphertext returned by PGPEncrypt function,
 * the corresponding private key and the password used
 * to generate that key pair.
 * @param {string} :ciphertext
 * @param {string}: corresponding key to the one used during encryption
 * @param {string}: password used to generate the key pair
 * @return {string}: plaintext
**/
function PGPDecrypt(ciphertext, PGPKey, password){
  var priv_key = openpgp.read_privateKey(PGPKey);

  if (priv_key.length < 1) {
    console.log("No private key found!")
    return null;
  }

  var msg = openpgp.read_message(ciphertext);
  var keymat = null;
  var sesskey = null;
  // Find the private (sub)key for the session key of the message
  for (var i = 0; i< msg[0].sessionKeys.length; i++) {
    if (priv_key[0].privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
      keymat = { key: priv_key[0], keymaterial: priv_key[0].privateKeyPacket};
      sesskey = msg[0].sessionKeys[i];
      break;
    }
    for (var j = 0; j < priv_key[0].subKeys.length; j++) {
      if (priv_key[0].subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
        keymat = { key: priv_key[0], keymaterial: priv_key[0].subKeys[j]};
        sesskey = msg[0].sessionKeys[i];
        break;
      }
    }
  }
  if (keymat != null) {
    if (!keymat.keymaterial.decryptSecretMPIs(password)) {
      console.log("Password for secrect key was incorrect!");
      return;

    }
    return msg[0].decrypt(keymat, sesskey);
  } else {
    console.log("No private key found!");
  }
  return null;
}
/**
 * Function to execute after content is returned by the content server.
 * It is responsible for assigning the content of the document as well as
 * resizing the iframe containing it.
 *
 * @param {object} response The response from the remote server. In cases
 * without error, the response body will be in response.response.
 *
 */
function contentCallback(response) {
  
  if( response.jqXHR.status === 200 ) {
    
    var json = response.json;
    var html = null;
    
    if( json !== null && json.rendered_markdown) {
      html = json.rendered_markdown;
      // Set the permissions the user has on the content
      if ( json.permissions !== undefined ) {
        permissions = json.permissions;
        if ( permissions.canupdate ) {
          var domain = jsonURL.split("/")[2];
          privlyTooltip.updateMessage(domain + " PGPPost: Editable");
        }
      }
    }
    // Get private key and password stored at user's end.
    var privatePGPKey;
    var password;
    if ( privatePGPKey != null && password != null ) {
      $("#post_content").html(PGPDecrypt(html_sanitize(html)), privatePGPKey, password);
    }
    else {
      $("#post_content").html("Something wrong with privatekey or password");
    }
    
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
    
  } else if(response.jqXHR.status === 403) {
    $("#post_content").html("<p>Your current user account does not have access to this.</p>");
  } else {
    $("#post_content").html("<p>You do not have access to this.</p>");
  }
}

jQuery(window).load(function(){
  openpgp.init();
  
  // Creates a tooptip which indicates the content is not a 
  // natural element of the page
  privlyTooltip.tooltip();
  
  // Set the application and data URLs
  var href = window.location.href;
  webApplicationURL = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  parameters = privlyParameters.getParameterHash(webApplicationURL);
  if (parameters["privlyDataURL"] !== undefined) {
    jsonURL = parameters["privlyDataURL"];
  } else {
    jsonURL = webApplicationURL.replace("format=iframe", "format=json");
    
    //deprecated
    webApplicationURL = webApplicationURL.replace("format=iframe", "format=html");
  }
  
  // Make the cross origin request as if it were on the same origin.
  privlyNetworkService.initPrivlyService(false);
  privlyNetworkService.sameOriginGetRequest(jsonURL, contentCallback);
  
  // Register the click listener.
  jQuery("body").on("click", singleClick);
  
  // Display the domain of the content in the glyph
  var domain = jsonURL.split("/")[2];
  privlyTooltip.updateMessage(domain + " PlainPost: Read Only");
  
});
