/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The functions of the keymanager
 *
 * 1. setNewPGPKey: Update localforage key withe value passed in.
 * 2. addNewPGPKey: Adds private/pub keys to localforage by calling set
 * 3. promptUserToLogin: Ask user to login on directory provider, return with 
 *    persona key after user logs in.
 * 4. getPersonaKey: Get Persona Key from localstorage
 * 5. genPGPkeys: The extension is checking PGP keys exist and are not expired.
 * 6. uploadKey: Upload a backed identity assertion and public key to a
 *    directory provider.
 */
var keyManager = {

  /**
   * Update the localforage key with the value passed in
   */
  setNewPGPKey: function(key, appended_value, callback){
    localforage.setDriver('localStorageWrapper', function() {
      localforage.getItem('email', function(email) {
        localforage.getItem(key, function(value) {
          if (value === null){
            value = {};
          }
          if (email in value){
            value[email].unshift(appended_value);
          } else {
            value[email] = [appended_value];
          }
          localforage.setItem(key,value,callback);
        });
      });
    });
  },

  /**
   * Add pub keys to my_contacts
   * Add private/pub keypair to my_keypairs
   */
  addNewPGPKey: function(keypair,callback){
    var pubkey = keypair.publicKeyArmored;
    keyManager.setNewPGPKey('my_keypairs',keypair,function(result){
      keyManager.setNewPGPKey('my_contacts',pubkey,callback);
    });
  },

  /*
   * Ask user to login on directory provider. Create listener for storage
   * events. Return persona-bridge when updated.
   */
  promptUserToLogin: function(callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('directoryURL',function(directoryURL){
        $("#messages").hide();
        $("#persona_link").attr("href",directoryURL);
        $("#login_persona").show();
        document.addEventListener('storage', function(storageEvent){
          if (storageEvent.key === 'persona-bridge'){
            callback(storageEvent.newValue);
          }
        });
      });
    });
  },

  /*
   * Ask user to set email in options. Create listener for storage events.
   * Return email when updated.
   */
  promptUserToSetEmail: function(callback){
    $("#messages").hide();
    $("#need_email").show();
    // Add to local storage on clicking the save button
    document.querySelector('#save_email').addEventListener('click',function(){
      var email = document.getElementById("emailAddress").value;
      localforage.setDriver('localStorageWrapper',function(){
        localforage.setItem('email',email,function(){
          $("#need_email").hide();
          callback(email);
        });
      });
    });
    // Set to local storage to save value on hitting enter 
    var email_input = document.getElementById("emailAddress");
    email_input.onkeyup = function(){
      if (event.keyCode === 13){ // user hit enter
        localforage.setDriver('localStorageWrapper',function(){
          localforage.setItem('email',email_input.value,function(){
            $("#need_email").hide();
            callback(email);
          });
        });
      }
    };
  },

  /*
   * Ask user to set directory in options. Create listener for storage events.
   * Return directoryURL when updated.
   */
  promptUserToSetDirectory: function(callback){
    // TODO: combine this and promptEmail to be more DRY
    $("#messages").hide();
    $("#need_directory").show();
    // Add to local storage on clicking the save button
    document.querySelector('#save_directory').addEventListener('click',function(){
      var directoryURL = document.getElementById("directoryURL").value;
      localforage.setDriver('localStorageWrapper',function(){
        localforage.setItem('directoryURL',directoryURL,function(){
          $("#need_directory").hide();
          callback(directoryURL);
        });
      });
    });
    // Set to local storage to save value on hitting enter 
    var directory_input = document.getElementById("directoryURL");
    directory_input.onkeyup = function(){
      if (event.keyCode === 13){
        localforage.setDriver('localStorageWrapper',function(){
          localforage.setItem('directoryURL',directory_input.value,function(){
            $("#need_directory").hide();
            callback(directoryURL);
          });
        });
      }
    };
  },
  
  /**
   * Determine if a new persona key needs to be generated
   *
   * This returns true under two conditions:
   *   1) Localstorage does not contain persona-bridge.
   *   2) Localstorage contains a key that is expired or is about to expire.
   *    TODO: evaluate if persona-bridge is about to expire
   */
  needPersonaKey: function(callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('persona-bridge',function(persona){
        callback(persona == null);
      });
    });
  },

  /**
   * Get Persona Key from localstorage
   */
  getPersonaKey: function(callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('persona-bridge',function(persona){
        localforage.getItem('email',function(email){
          if (email == null){
            console.log("Email not found");
            callback(null);
          }
          if (persona != null) {
            var secretkey = PersonaId.getSecretKeyFromBridge(persona, email);
            console.log("Persona secret key: ",secretkey);
            callback(secretkey);
          } else {
            keyManager.promptUserToLogin(function(bridge){
              var secretkey = PersonaId.getSecretKeyFromBridge(bridge, email);
              console.log("Persona secret key: ",secretkey);
              callback(secretkey);
            });
          }
        });
      });
    });
  },

  /**
   * Evaluate if a new key needs to be generated.  
   *
   * This returns true under two conditions:
   *   1) Localstorage does not contain a key.
   *   2) Localstorage contains a key that is expired or is about to expire.
   */
  needNewKey: function(callback){
    // Determine if a key is already in local storage
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(keypairs){
        if (keypairs === null){ // no key found, return true
          callback(true);
        } else { // it does exist,check expirey regenerate if needed
          // TODO: check if key is about to expire and gen a new one if needed
          // Note: Currently openPGP.js does not support setting a key
          // expiration. Since nearly all of the keys we deal with are generated
          // with openPGP.js, we do not yet check to see if keys expire.
          console.log("Already have a key.");
          callback(false);
        }
      });
    });
  },

  /**
   * Generate a PGP key, add it to local storage, and upload it to directory.
   */
  genPGPKeys: function(){
    console.log("Generating New Key");
    var workerProxy = new openpgp.AsyncProxy('../vendor/openpgp.worker.js');
    workerProxy.seedRandom(10); // TODO: evaluate best value to use
    workerProxy.generateKeyPair(
      openpgp.enums.publicKey.rsa_encrypt_sign,
      512,'username','passphrase',function(err,data){ // TODO: increase key
        keyManager.addNewPGPKey(data,function(result){
          keyManager.uploadKey(function(outcome){});
        });
      }
    );
  },

  
  /**
   * Upload a signed PGP public key to a directory provider.
   *
   * On a high level, this function needs to:
   *   1) Have access to the Persona private key
   *   2) Sign the key passed in with the Persona Private key
   *   3) Upload the signed public key to the directory provider.
   */
  uploadKey: function(callback){
    console.log("Uploading key");
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(my_keys){
      localforage.getItem('email',function(email){
      localforage.getItem('directoryURL',function(directoryURL){
        var keypair = my_keys[email][0];// most recent key
        if (keypair === null) {
          console.log("No key to upload found");
          callback(false);
        }
        var pubkey = keypair.publicKeyArmored;
        keyManager.getPersonaKey(function(secretkey) {
          if (secretkey !== null) {
            // TODO: Find a better way to seed jwcrypto.
            jwcrypto.addEntropy("ACBpasdavbepOAEfBPBHESAEFGHA");
            directoryURL += "/store";
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
          } else {
            console.log("Secret key is null");
            callback(false);
          }
        });
      });
      });
      });
    });
  }
}
