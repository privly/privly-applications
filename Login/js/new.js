/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app does not currently know whether it is logged
 *    in
 * 2. Not logged in: The app displayed the login form for the user.
 * 3. Login Failure: the user supplied incorrect credentials for logging
 *    into the remote server.
 * 4. Submit Credentials: Send the credentials to the remote server.
 * 5. Check Credentials: The credentials check has returned from the
 *    server and is being checked for acceptance.
 * 6. Login Failure: The server did not grant the user a session.
 * 7. Login Error: The server could not be reached or had an internal error.
 * 8. Pending Post: The user is properly logged in and can create content.
 * 9. genPGPkeys: The extension is checking PGP keys exist and are not expired.
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {
    
    // Display the content server the user is asssociated with
    $(".content_server").text(privlyNetworkService.contentServerDomain());
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Monitor the login button
    document.querySelector('#login').addEventListener('click', callbacks.submitCredentials);
    $("#user_password").keyup(function (e) {
        if (e.keyCode == 13) {
            callbacks.submitCredentials();
        }
    });
    
    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() { 
      $('#loadingDiv').hide(); 
    });
    
    // See if the user is currently logged in
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      callbacks.pendingPost, 
      callbacks.notLoggedIn, 
      callbacks.loginError);

    // Generate a PGP Keypair if needed
    callbacks.genPGPKeys();
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  notLoggedIn: function() {
    $("#messages").hide();
    $("#form").show();
  },
  
  /**
   * Submit the posting form and await the return of the post.
   */
  submitCredentials: function() {
    $("#save").prop('disabled', true);
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/users/sign_in", 
      callbacks.checkCredentials,
      {"user[email]":  $("#user_email").val(),
       "user[password]":  $("#user_password").val()
       });
  },
  
  
  /**
   * Check to see if the user's credentials were accepted by the server.
   */
  checkCredentials: function(response) {
    
    if ( response.json.success === true ) {
      callbacks.pendingPost();
    } else {
      callbacks.loginFailure();
    }
  },
  
  /**
   * Tell the user their credentials were rejected.
   */
  loginFailure: function() {
    $("#messages").text("Bad username or password. " + 
      "Too many failed attempts will lock the account.");
    $("#messages").show();
  },
  
  /**
   * Tell the user their content server could not be reached.
   */
  loginError: function() {
    $("#messages").text("Your content server is unavailable.");
    $("#messages").show();
  },
  
  /**
   * Tell the user they are now logged in to the server.
   */
  pendingPost: function() {
    window.location = "../Help/new.html";
  },

  /**
   * Update the localforage key with the value passed in
   */
  genPGPKeysHelper: function(key, appended_value,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('email',function(email){
        localforage.getItem(key,function(value){
          if (value === null){
            value = {};
          }
          if (email in value){
            value[email].unshift(appended_value);
          } else {
            value[email] = [appended_value];
          }
          localforage.setItem(key,value,function(result){
            callback(result);
          });
        });
      });
    });
  },

  /**
   * Add pub keys to my_contacts
   * Add private/pub keypair to my_keypairs
   */
  genPGPKeysAdder: function(keypair,callback){
    callbacks.genPGPKeysHelper('my_keypairs',keypair,function(result){
      keypair = keypair.publicKeyArmored;
      callbacks.genPGPKeysHelper('my_contacts',keypair,function(result){
        callback(result);
      });
    });
  },

  /*
   * Ask user to login on directory provider, return when persona key set
   */
  promptUserToLogin: function(directoryURL,callback){
    var msg = "Please verify your identity by logging in with "; 
    msg += "<a class='login_url btn btn-default' href='"+directoryURL+"'>";
    msg += "Persona</a>";
    $("#messages").text(msg);
    $("#messages").show();
    // listen for addition of persona-bridge to localstorage
    return true;
  },

  /**
   * Get Persona Key from localstorage
   */
  getPersonaKey: function(callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('persona-bridge',function(persona){
        localforage.getItem('email',function(email){
          if (persona !== null) {
            secretkey = PersonaId.getSecretKeyFromBridge(persona, email);
            console.log("Persona secret key: ",secretkey);
            callback(secretkey);
          } else {
            console.log("Persona bridge not present.");
            callback(null);
          }
        });
      });
    });
  },

  /**
   * Genereate a PGP key if it does not exist or is nearly expired
   */
  genPGPKeys: function(){
    // Determine if a key is already in local storage
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('email',function(email){
        localforage.getItem('my_keypairs',function(keypairs){
          if (keypairs === null){ // it does not exist, make it
            console.log("Generating New Key");
            var workerProxy = new openpgp.AsyncProxy('../vendor/openpgp.worker.js');
            workerProxy.seedRandom(10); // TODO: evaluate best value to use
            workerProxy.generateKeyPair(
              openpgp.enums.publicKey.rsa_encrypt_sign,
              1028,'username','passphrase',function(err,data){ // TODO: increase key
                callbacks.genPGPKeysAdder(data,function(result){
                  callbacks.uploadKey(email,function(outcome){
                    if (outcome === false){
                      console.log("Could not upload key.");
                    }
                  });
                });
              }
            );
          } else { // it does exist,check expirey regenerate if needed
            console.log("Already have a key, but uploading anyways.");
            // TODO: check if key is about to expire and gen a new one if needed
            callbacks.uploadKey(email,function(outcome){
              if (outcome === false){
                console.log("Could not upload key.");
              } else {
                console.log("Succesfully uploaded key.");
              }
            });
          }
        });
      });
    });
  },

  /**
   * Upload a backed identity assertion and public key to a directory provider.
   * Currently this is not called because the remote resources this function
   * depends on are not mature. 
   *
   * On a high level, this function needs to:
   *   1) Generate a Backed Identity Assertion or have access to one
   *   2) Take the public key out of the BIA and sign the key that was just
   *      generated above in the genPGP function.
   *   3) Upload the BIA and signed public key to the directory provider.
   */
  uploadKey: function(email,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(my_keys){
        keypair = my_keys[email][0];// most recent key
        if (keypair === null) {
          console.log("No key to upload found");
          callback(false);
        }
        var pubkey = keypair.publicKeyArmored;
        callbacks.getPersonaKey(function(secretkey) {
          if (secretkey !== null) {
            localforage.getItem('directoryURL',function(directoryURL){
              directoryURL += "/store";
              // TODO: Find a better way to seed jwcrypto.
              jwcrypto.addEntropy("ACBpasdavbepOAEfBPBHESAEFGHA");
              PersonaId.bundle(pubkey, secretkey, email, function(payload) {
                console.log("payload:", payload);
                $.get(
                  directoryURL,
                  payload
                ).done(function(response){
                  console.log("Upload Success");
                  callback(true);
                }
                ).fail(function(response){
                  console.log("Upload Fail");
                  callback(false);
                });
              });
            });
          }
        });
      });
    });
  }
}


// Start the application
document.addEventListener('DOMContentLoaded', callbacks.pendingLogin);
