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
 * Gives the URL of the encrypted content.
 *
 * @return {string} Return the url where the data is stored.
 *
 */
function cipherTextUrl() {
    return getParameterHash()["privlyCiphertextURL"];
}

function decompress(data) {
    return Base64.btou( RawDeflate.inflate( Base64.fromBase64(data) ) );
}
function decipher(key, data) {
    return decompress(sjcl.decrypt(key,data));
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
    if (json.structured_content !== undefined) {
      // Load the privKey and password from server for this particular user
      var cleartext = decrypt(json.structured_content, privKey, password);
      $('div#cleartext').text(cleartext);
      urls2links($('div#cleartext')); // Convert URLs to clickable links.
    } else {
      $('div#cleartext').text("The data behind this link is corrupted.");
    }
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
  } else if( response.jqXHR.status === 403 ) {
    $('div#cleartext').text("Your current user account does not have access to this.");
    privlyHostPage.resizeToWrapper();
  } else {
    $('div#cleartext').text("You do not have access to this.");
    privlyHostPage.resizeToWrapper();
  }
}

/*
 * Decrypts the GEobj with the supplied privKey
 *  @param {GEobjobject}  GEobject having three fields
 *  'GEciphertext' : @{string} The cipher text obtained after encryption of message
 *  'GElinkkey' : @{string} The link key used to encrypt the message
 *  'GEcontentkey'  : @{string} The content key after being encrypted first by GElinkkey
 *  then by pubKey
 *  @param {privKey} string openpgpjs private key in armored format
 *  @param {password} string : the password used to generate the keys
 *  @return {string} plaintext
 */
function decrypt(GEobj, privKey, password){
  var priv_key = openpgp.read_privateKey(privKey);

  if (priv_key.length < 1) {
    console.log("No private key found!")
    return;
  }

  var msg = openpgp.read_message(GEobj['GEcontentkey']);
  var keymat = null;
  var sesskey = null;
  var DecCK1;
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
    DecCK1 = msg[0].decrypt(keymat, sesskey);
    console.log(DecCK1);
  } else {
    console.log("No private key found!");
  }
  var linkKey = GEobj['GElinkkey'];
  DecCK1 = JSON.parse(DecCK1);
  var DecCK2;
  console.log(DecCK1);
  if (DecCK1.match("{")){
    console.log("Its jasonized");
    DecCK2 = decipher(linkKey,DecCK1);
    //$('#twiceDecCK').html(DecCK2);
  }
  else{
    console.log('Its raw');
  }
  return decipher(DecCK2, JSON.parse(GEobj['GEciphertext']));
}

/**
 * Opens the injected content in a new window. If the user clicked a link
 * in the injected content, the link is followed in the current window.
 */
function singleClick(evt) {
  if(evt.target.nodeName == "A"){
    parent.window.location = evt.target.href;
  } else {
    window.open(webApplicationURL, '_blank');
  }
};


/**
 * On Page load, the forms and layouts are initialized.
 * If the URL's hash contains content, then the application
 * will attempt to fetch the remote ciphertext for decryption
 */
jQuery(window).load(function(){
  openpgp.init();
  // Creates a tooptip which indicates the content is not a 
  // natural element of the page
  privlyTooltip.tooltip();
  
  // Set the application and data URLs
  var href = window.location.href;
  webApplicationURL = href.substr(href.indexOf("privlyOriginalURL=") + 18);
  parameters = privlyParameters.getParameterHash(href);
  jsonURL = parameters["privlyCiphertextURL"];
  
  if (parameters["privlyDataURL"] !== undefined) {
    jsonURL = parameters["privlyDataURL"];
  }
  
  // Make the cross origin request as if it were on the same origin.
  privlyNetworkService.sameOriginGetRequest(jsonURL, contentCallback);
  
  // Register the click listener.
  jQuery("body").on("click",singleClick);
  
  // Display the domain of the content in the glyph
  var domain = jsonURL.split("/")[2];
  privlyTooltip.updateMessage(domain + " ZeroBin");
  
});