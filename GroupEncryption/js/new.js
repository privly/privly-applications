/**
 * @fileOverview Manages the form interaction with remote servers.
 **/
sjcl.random.startCollectors();
function compress(message) {
    return Base64.toBase64( RawDeflate.deflate( Base64.utob(message) ) );
}

function cipher(key, message) {
    return sjcl.encrypt(key,compress(message));
}
/**
 * Attempt to submit the content to the content server, then fire the URL
 * event for the extension to capture.
 */
function submit() {
   
   if (!sjcl.random.isReady()) {
        sjcl.random.addEventListener('seeded', function(){ submit(); }); 
        return; 
    }
   var contentKey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
   var linkKey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);

   var cipherdata = cipher(contentKey, $('#content')[0].val());
   var retObj = {};
   retObj['GElinkkey'] = linkKey;
   retObj['GEciphertext'] = JSON.stringify(cipherdata);

   var EncCK1 = cipher(linkKey,contentKey);

   var pubKeyObj = openpgp.read_publicKey(pubKey);

   if (pubKeyObj < 1) {
     console.log("No public key found!")
     return;
   }
   retObj['GEcontentkey']=openpgp.write_encrypted_message(pubKeyObj,JSON.stringify(EncCK1));
   var data_to_send = {
     post:{
       structured_content: retObj
     }};
  
  function successCallback(response) {
    receiveUrl(response, linkKey, contentKey);
  }
  
  privlyNetworkService.sameOriginPostRequest("/posts", 
                                             successCallback, 
                                             data_to_send,
                                             {"format":"json"});
}

/**
 * Callback defined for handling the return of posting new content
 * 
 * @param response object response from remote server.
 */
function receiveUrl(response, linkKey, contentKey) {
  
  //Form the URL for people to share it.
  var params = {"privlyLinkKey": linkKey,
    "privlyInjectableApplication": "GroupEncryption",
    "privlyContentKey": contentKey,
    "privlyCiphertextURL": response.jqXHR.getResponseHeader("X-Privly-Url"),
    "privlyInject1": true
  };
  var url = privlyNetworkService.contentServerDomain() + '#' + 
              privlyParameters.hashToParameterString(params);
  
  privlyExtension.firePrivlyURLEvent(url);
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners() {
  //submitting content
  document.querySelector('#save').addEventListener('click', submit);
}


/**
 *
 */
function initPosting() {
  
  function successCallback() {};
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(successCallback, successCallback, 
                                         successCallback);
}

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);
document.addEventListener('DOMContentLoaded', initPosting);