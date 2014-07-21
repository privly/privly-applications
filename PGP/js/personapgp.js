/**
 * @fileOverview This JavaScript is set of functions for pgp related actions.
 * These actions include Finding keys, calling a key verifier, encrypting, and
 * decrypting.
 **/

/**
 * The functions in PersonaPGP:
 *
 * 1. Key Search: Check localForage and remote directory for keys associated
 *    with email address. Should return public key of message recipient. If the
 *    email is found remotely, it is verified and then added to localForage.
 *    Callback=findPubKey
 * 2. Remote Key Search: The function that queries the remote directory for
 *    email addresses. If it is found, calls addRemoteKeyToLocal.
 *    Callback=findPubKeyRemote
 * 3. Add Key to Local Storage: This function authenticates a key with the
 *    verifyPubKey function, and adds it to localforage if it is valid.
 *    Callback=addRemoteKeyToLocal
 * 4. Verify Public Key: Verifies if a public key is in fact associated with
 *    an email address using the remote verifier.
 *    Callback=verifyPubKey
 * 5. Encrypt a message: Converts a message to json and then encrypts it using
 *    openpgp.js.  The conversion to json is used as a method to later ensure
 *    that decryption occurred successfully.  This is needed when the keyid used
 *    to encrypt a message is not disclosed.
 *    Callback=encrypt
 * 6. Decrypt a message: Converts ciphertext into cleartext. As an additional
 *    assurance verifies that decrypted message is valid json.
 */
var PersonaPGP = {
  /**
   * Attempt to find the public key of a given email address.  Looks at local
   * resources before querying remote resources. 
   *
   * @param {string} email The email that the user wants to find the associated 
   * public keys of.
   * @param {function} callback The function that gets called after a key search
   * takes place. The function should accept an array of public keys or null as
   * a paremter.
   */
  findPubKey: function(email,callback){
    // query localForage 
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('pgp-my_contacts',function(pubkey_email_hash){
        if (email in pubkey_email_hash) {
          var pub_keys = pubkey_email_hash[email]; 
          // TODO: see if they are expired, look remotely for new key as needed
          callback(pub_keys); //array of pub keys associated with email
        } else { // not found locally, query DirP
          PersonaPGP.findPubKeyRemote(email,function(bia_pub_keys){
            if (bia_pub_keys == null){
              callback(null);
            } else { // Found remotely, verify and add to localForage
              PersonaPGP.findPubKeyRemoteHelper(email,bia_pub_keys,callback);
            }
          });
        }
      });
    });
  },

  /**
   * This function takes a backed identity assertion and signed pub key and
   * verifies that the email it is for matches.
   *
   * @param {object} bia_pub_key The backed identity assertion and public key
   * that was returned from the directory server.
   * @param {string} email The email the user originally searched for.
   **/
  emailMatch: function(bia_pub_key,email){
    if (PersonaId.extractEmail(bia_pub_key["bia"]) === email){
      return true;
    }
    return false;
  },

  /**
   * This function makes multiple async calls and waits for them all to finish.
   * Only the verified keys are returned.
   *
   * @param {object} bia_pub_key The backed identity assertion and public key
   * that was returned from the directory server.
   * @param {string} email The email the user originally searched for.
   * @param {function} callback The function that is run once all keys have
   * been verified. This function should accept an array of verified keys.
   */
  findPubKeyRemoteHelper: function(email,bia_pub_keys,callback){
    var verified = {};
    var callAddRemote = function(i){
      PersonaPGP.addRemoteKeyToLocal(bia_pub_keys[i],function(result,pub_key){
        if (PersonaPGP.emailMatch(bia_pub_keys[i],email)){
          if (result in verified){
            verified[result].push(pub_key);
          } else {
            verified[result] = [pub_key];
          }
        } else { // Email queried did not match email in bia
          console.warn("The directory provider is confused or malicous");
          if (false in verified){
            verified[false].push("1");
          } else {
            verified[false] = ["1"];
          }
        }
        // calculate if we have verified all the keys
        var size = 0;
        if (verified[true] != undefined){
          size += verified[true].length;
        }
        if (verified[false] != undefined){
          size += verified[false].length;
        }
        // call callback if we have verified all the keys
        if (size == bia_pub_keys.length) {
          callback(verified[true]);
        }
      });
    };

    for(var i = 0; i < bia_pub_keys.length; i++){
      callAddRemote(i);
    }
  },

  /**
   * Attempt to find the public key of a given email address from the remote
   * directory.
   *
   * @param {string} email The email that the user wants to send a message to.
   * @param {function} callback The function that is run once a response from
   * the directory server is returned.  This function should accept an array of
   * objects or null as a parameter.
   */
  findPubKeyRemote: function(email,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('pgp-directoryURL',function(remote_directory){
        remote_directory += "/search";
        var value = {
          email: email
        };
        $.get(
          remote_directory,
          value
        ).done(function(response){ // Everything went according to plan
          console.log("findPubKeyRemote is returning: ", response);
          callback(response); // Returns [{bia:bia, pgp:signed_pub_key}]
        }
        ).fail(function(response){
          if (response.status === 404){
            console.log("Email not found in Remote Directory");
            console.log("Invite friend to share privately goes here");
          } else {
            console.log("Problem connecting to Remote Directory");
          }
          callback(null);
        });
      });
    });
  },

  /**
   * Add the key that was found remotely to localforage. Entry is keyed by
   * email address and has a value of every component that is needed in order
   * to authenticate with the verifier.
   *
   * @param {object} bia_pub_key The backed identity assertion and signed
   * public key.
   * @param {function} callback The function that is run once a remote key has
   * gone through the verification process.  This function should accept a
   * boolean and a public key or null as paremeters.
   */
  addRemoteKeyToLocal: function(bia_pub_key,callback){
    var email = PersonaId.extractEmail(bia_pub_key["bia"]);
    PersonaPGP.verifyPubKey(bia_pub_key,function(outcome,pgp_pub_key){
      if (outcome === true){
        localforage.setDriver('localStorageWrapper',function(){
          localforage.getItem('pgp-my_contacts',function(data){
            if (email in data){
              data[email].push(pgp_pub_key);
            } else {
              data[email] = [pgp_pub_key];
            }
            localforage.setItem('pgp-my_contacts',data,function(){
              callback(true,pgp_pub_key);
            });
          });
        });
      } else {
        callback(false,null);
      }
    });
  },

  /**
   * This function calls a function to verify the signature on the signed pgp
   * key.  Assuming the signature is valid, it then calls a function that
   * queries the remote verifier for verification of the bia.
   *
   * In other words, this function:
   *   1) verifes the signature on the public key
   *   2) verifes the backed identity assertion passed to it using the remote
   *      verifier.
   *   3) returns the now trusted public key.
   *
   * @param {object} bia_pub_key A bia and signed pgp public key to be
   * verified.  
   * @param {function} callback The function that is run once a remote key has
   * gone through the remote verification process.  This function should accept
   * a boolean and a public key or null as paremeters.
   */
  verifyPubKey: function(bia_pub_key,callback){
    PersonaId.verifyPayload(bia_pub_key,function(outcome,key){
      if (outcome === true){
        //console.log("Signature on PGP key is valid");
        var bia = bia_pub_key['bia'];
        PersonaId.remotelyVerifyBia(bia,function(bia_outcome){
          if (bia_outcome === true){
            //console.log("Bia is valid");
            callback(true,key);
          } else {
            //console.log("Bia is invalid");
            callback(false,null);
          }
        });
      } else {
        //console.log("Signature on PGP key is invalid");
        callback(false,null);
      }
    });
  },

