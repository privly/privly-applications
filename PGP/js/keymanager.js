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
   *
   * @param {string} key The localforage key that is going to be set.
   * @param {object} appended_value The value to append to the localforage
   * entry.
   * @param {function} callback The function that will be executed after
   * the localforage item is set.
   */
  setNewPGPKey: function(key, appended_value, callback){
    localforage.setDriver('localStorageWrapper', function() {
      localforage.getItem('pgp-email', function(email) {
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
   *
   * @param {object} keypair The keypair object that is going to be added
   * to my_contacts and my_keypairs.
   * @param {function} callback The function that will be executed after
   * the keypair has been set in both my_contacts and my_keypairs.
   */
  addNewPGPKey: function(keypair,callback){
    var pubkey = keypair.publicKeyArmored;
    keyManager.setNewPGPKey('pgp-my_keypairs',keypair,function(result){
      keyManager.setNewPGPKey('pgp-my_contacts',pubkey,callback(result));
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
   *
   * @param {function} callback The function that gets called after a key is
   * uploaded to the key server. This function should accept a boolean value as
   * a paremeter.
   */
  uploadKey: function(callback){
    console.log("Uploading key");
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('pgp-my_keypairs',function(my_keys){
      localforage.getItem('pgp-email',function(email){
      localforage.getItem('pgp-directoryURL',function(directoryURL){
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
