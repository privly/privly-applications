/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The functions of the keymanager
 *
 * 1. setNewPGPKey: Update local storage key withe value passed in.
 * 2. addNewPGPKey: Adds private/pub keys to local storage by calling set
 * 3. promptUserToLogin: Ask user to login on directory provider, return with 
 *    persona key after user logs in.
 * 4. getPersonaKey: Get Persona Key from localstorage
 * 5. genPGPkeys: The extension is checking PGP keys exist and are not expired.
 * 6. uploadKey: Upload a backed identity assertion and public key to a
 *    directory provider.
 */
var keyManager = {

  /**
   * Update the local storage key with the value passed in
   *
   * @param {string} key The local storage key that is going to be set.
   * @param {object} appended_value The value to append to the local storage
   * entry.
   * @param {function} callback The function that will be executed after the
   * local storage item is set.
   */
  setNewPGPKey: function(key, appended_value, callback){
    var email = ls.getItem('pgp:email');
    var value = ls.getItem(key);
    if (value === undefined){
      value = {};
    }
    if (email in value){
      value[email].unshift(appended_value);
    } else {
      value[email] = [appended_value];
    }
    ls.setItem(key, value);
    callback();
  },

  /**
   * Add pub keys to my_contacts
   * Add private/pub keypair to my_keypairs
   *
   * @param {object} keypair The keypair object that is going to be added
   * to my_contacts and my_keypairs.
   * @param {function} callback The function that will be executed after
   * the keypair has been set in both my_contacts and my_keypairs.
   */
  addNewPGPKey: function(keypair, callback){
    var pubkey = keypair.publicKeyArmored;
    keyManager.setNewPGPKey('pgp:my_keypairs', keypair, function(){
      keyManager.setNewPGPKey('pgp:my_contacts', pubkey, function(){
        callback();
      });
    });
  },

  /*
   * Ask user to login on directory provider. Create listener for storage
   * events. Return pgp:persona-bridge when updated.
   *
   * @param {function} callback The function that will be executed after
   * pgp:persona-bridge has been set in local storage. This function should
   * accept the value of the pgp:persona-bridge as a paremeter.
   */
  promptUserToLogin: function(callback){
    var directoryURL = ls.getItem('pgp:directoryURL');
    $("#messages").hide();
    $("#persona_link").attr("href", directoryURL);
    $("#login_persona").show();
    document.addEventListener('storage', function(storageEvent){
      if (storageEvent.key === 'pgp:persona-bridge'){
        callback(storageEvent.newValue);
      }
    });
  },

  /*
   * Ask user to set email in options. Create listener for storage events.
   * Return email when updated.
   *
   * @param {function} callback The function that will be executed after
   * the email address has been set by the user. This function should accept
   * the email string as a paremeter.
   */
  promptUserToSetEmail: function(callback){
    $("#messages").hide();
    $("#need_email").show();
    // Add to local storage on clicking the save button
    document.querySelector('#save_email').addEventListener('click', function(){
      var email = document.getElementById("emailAddress").value;
      ls.setItem('pgp:email', email);
      $("#need_email").hide();
      callback(email);
    });
    // Set to local storage to save value on hitting enter 
    var email_input = document.getElementById("emailAddress");
    email_input.onkeyup = function(){
      if (event.keyCode === 13){ // user hit enter
        ls.setItem('pgp:email', email_input.value);
        $("#need_email").hide();
        callback(email_input.value);
      }
    };
  },

  /**
   * Notify the user there is a connectivity problem with the passed in
   * resource.
   *
   * @param {string} resource The remote resource that cannot be accessed.
   */
  notifyConnectivity: function(resource){
    var payload = ls.getItem('pgp:payload');
    $("#connectivity_resource").text(resource);
    $("#notify_connectivity").show();
    $("#retry_connectivity").click(function(){
      if (payload !== undefined) { // have stored payload
        keyManager.uploadPayload(payload, function(results){ 
          console.log("Upload results: "+results);
          if (results === true){
            $("#notify_connectivity").hide();
          }
        });
      } else {
        $("#notify_connectivity").hide();
      }
    });
  },
  
  /**
   * Determine if a new persona key needs to be generated
   *
   * This returns true under two conditions:
   *   1) Localstorage does not contain pgp:persona-bridge.
   *   2) Localstorage contains a key that is expired or is about to expire.
   *    TODO: evaluate if pgp:persona-bridge is about to expire
   *
   * @param {function} callback The function that gets called after we
   * determine if pgp:persona-bridge is present. This function should accept a
   * boolean value as a paremeter.
   */
  needPersonaKey: function(callback){
    var persona = ls.getItem('pgp:persona-bridge');
    if (persona != null){
      var email = ls.getItem('pgp:email');
      if (PersonaId.getSecretKeyFromBridge(persona, email) != null) {
        var key = JSON.parse(persona.emails);
        var updated = key.default[email].updated;
        var thirty_days = 60*60*24*30; // 30 days in seconds
        callback(((Date.now() - Date.parse(updated)) > thirty_days));
      } else {
        callback(true);
      }
    } else {
      callback(true);
    }
  },

  /**
   * Get Persona Key from localstorage
   *
   * @param {function} callback The function that gets called after the user
   * sets the directory URL. This function should accept the persona secret key
   * as a paremeter.
   */
  getPersonaKey: function(callback){
    var persona = ls.getItem('pgp:persona-bridge');
    var email = ls.getItem('pgp:email');
    if (email == null){
      callback(null);
    }
    if (persona != null) {
      var secretkey = PersonaId.getSecretKeyFromBridge(persona, email);
      callback(secretkey);
    } else {
      keyManager.promptUserToLogin(function(bridge){
        var secretkey = PersonaId.getSecretKeyFromBridge(bridge, email);
        callback(secretkey);
      });
    }
  },

  /**
   * Evaluate if a new key needs to be generated.  
   *
   * This returns true under two conditions:
   *   1) Local storage does not contain a key.
   *   2) Local storage contains a key that is expired or is about to expire.
   *
   * @param {function} callback The function that gets called after we
   * determine if a new key is needed. This function should accept a boolean
   * value as a parameter.
   */
  needNewKey: function(callback){
    // Determine if a key is already in local storage
    var keypairs = ls.getItem('pgp:my_keypairs');
    if (keypairs === undefined){ // no key found, return true
      callback(true);
    } else { // it does exist, check if it is expired
      var email = ls.getItem('pgp:email');
      // This assumes key 0 is the most recent key
      var created = keypairs[email][0].key.primaryKey.created;
      var thirty_days = 60*60*24*30; // 30 days in seconds
      callback((Date.now() - Date.parse(created)) > thirty_days);
    }
  },

  /**
   * Generate a PGP key, add it to local storage, and upload it to directory.
   *
   * @param {function} callback The function that gets called after a key is
   * generated and an attempt to upload it has been made. This function should
   * accept a boolean representing the upload outcome.
   */
  genPGPKeys: function(callback){
    console.log("Generating New Key");
    var workerProxy = new openpgp.AsyncProxy('../vendor/openpgp.worker.js');
    // TODO: evaluate best value to use for a random seed.
    // See https://github.com/privly/privly-applications/issues/65
    workerProxy.seedRandom(10); 
    workerProxy.generateKeyPair(
      openpgp.enums.publicKey.rsa_encrypt_sign,
      512,'username','passphrase', function(err, data){ // TODO: increase key
        keyManager.addNewPGPKey(data, function(result){
          keyManager.createPayload(function(payload){
            if (payload !== false){
              keyManager.uploadPayload(payload, function(outcome){
                callback(outcome);
              });
            } 
          });
        });
      }
    );
  },

  
  /**
   * Sign a PGP public with the persona private key.
   *
   * On a high level, this function needs to:
   *   1) Have access to the Persona private key
   *   2) Sign the key passed in with the Persona Private key
   *
   * @param {function} callback The function that gets called after a key is
   * uploaded to the key server. This function should accept the generated
   * payload as a paremeter.
   */
  createPayload: function(callback){
    console.log("Uploading key");
    var my_keys = ls.getItem('pgp:my_keypairs');
    var email = ls.getItem('pgp:email');
    var keypair = my_keys[email][0];// most recent key
    if (keypair === null) {
      console.log("No key to upload found");
      callback(false);
    }
    var pubkey = keypair.publicKeyArmored;
    keyManager.getPersonaKey(function(secretkey) {
      if (secretkey !== null) {
        // TODO: Find a better way to seed jwcrypto.
        // See https://github.com/privly/privly-applications/issues/65
        jwcrypto.addEntropy("ACBpasdavbepOAEfBPBHESAEFGHA");
        PersonaId.bundle(pubkey, secretkey, email, function(payload){
          callback(payload);
        });
      } else {
        console.log("Secret key is null");
        callback(false);
      }
    });
  },

  /**
   * Upload the passed in payload to a directory provider. The payload
   * consisits of a PGP public key signed with the Persona private key. 
   *
   * @param {object} payload The payload to be uploaded.
   * @param {function} callback The function that gets called after a key is
   * uploaded to the key server. This function should accept a boolean value as
   * a paremeter.
   */
  uploadPayload: function(payload, callback){
    var directoryURL = ls.getItem('pgp:directoryURL');
    directoryURL += "/store";
    $.get(
      directoryURL,
      payload
    ).done(function(response){
      console.log("Upload Success");
      ls.removeItem('pgp:payload');
      callback(true);
    }
    ).fail(function(response){
      console.log("Upload Fail");
      ls.setItem('pgp:payload', payload);
      callback(false);
    });
  }
}
