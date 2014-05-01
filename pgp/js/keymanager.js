/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Post: The user is properly logged in and can create content.
 * 2. genPGPkeys: The extension is checking PGP keys exist and are not expired.
 */
var keyManager = {

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
    // TODO make this consistent with how other messages are displayed
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
    console.log("Getting PersonaKey");
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('persona-bridge',function(persona){
        localforage.getItem('email',function(email){
          console.log(email);
          console.log(persona);
          if (email == null){
            console.log("Email not found");
            callback(null);
          }
          if (persona != null) {
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
          if (keypairs !== null){ // it does not exist, make it
            console.log("Generating New Key");
            var workerProxy = new openpgp.AsyncProxy('../vendor/openpgp.worker.js');
            workerProxy.seedRandom(10); // TODO: evaluate best value to use
            workerProxy.generateKeyPair(
              openpgp.enums.publicKey.rsa_encrypt_sign,
              512,'username','passphrase',function(err,data){ // TODO: increase key
                console.log("Key Generated");
                callbacks.genPGPKeysAdder(data,function(result){
                  console.log("Key added with adder");
                  callbacks.uploadKey(email,function(outcome){
                    if (outcome === false){
                      console.log("Could not upload key.");
                    } else {
                      console.log("Upload success.");
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
    console.log("Uploading key");
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(my_keys){
        console.log("Got my_keyapirs ");
        console.log(my_keys);
        keypair = my_keys[email][0];// most recent key
        console.log(keypair);
        if (keypair === null) {
          console.log("No key to upload found");
          callback(false);
        }
        var pubkey = keypair.publicKeyArmored;
        callbacks.getPersonaKey(function(secretkey) {
          console.log("Got PersonaKey");
          console.log(secretkey);
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
          } else {
            console.log("Secret key is null");
            callback(false);
          }
        });
      });
    });
  }
}
