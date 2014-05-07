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
   * @param {email} email The email that the user wants to find the associated 
   * pub key of.
   */
  findPubKey: function(email,callback){
    // query localForage 
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_contacts',function(pubkey_email_hash){
        if (email in pubkey_email_hash) {
          var pub_keys = pubkey_email_hash[email]; 
          // TODO: see if they are expired, look remotely for new key as needed
          callback(pub_keys); //array of pub keys associated with email
        } else { // not found locally, query DirP
          PersonaPGP.findPubKeyRemote(email,function(bia_pub_keys){
            if (bia_pub_keys == null){
              callback(null);
            } else { // Found remotely, verify and add to localForage
              PersonaPGP.findPubKeyRemoteHelper(email,bia_pub_keys,
                function(verified_keys){
                  //console.log("Verified keys:",verified_keys);
                  callback(verified_keys);
                }
              );
            }
          });
        }
      });
    });
  },

  /**
   * This function takes a backed identity assertion and signed pub key and
   * verifies that the email it is for matches.
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
   */
  findPubKeyRemoteHelper: function(email,bia_pub_keys,callback){
    var verified = {};
    var callAddRemote = function(i){
      PersonaPGP.addRemoteKeyToLocal(bia_pub_keys[i],function(result){
        /*********************************************************************
         * Call function that takes a signed PGP key and returns PGP key here*
         *********************************************************************/
        if (PersonaPGP.emailMatch(bia_pub_keys[i],email)){
          if (result in verified){
            verified[result].push(bia_pub_keys[i]);
          } else {
            verified[result] = [bia_pub_keys[i]];
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
   * @param {email} email The email that the user wants to send a message to.
   */
  findPubKeyRemote: function(email,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('directoryURL',function(remote_directory){
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
   * @param {email} email The email address the public key belongs to.
   * @param {assertion} ballOwax The backed identity assertion and accompanying
   * privly public key.
   */
  addRemoteKeyToLocal: function(bia_pub_key,callback){
    var email = PersonaId.extractEmail(bia_pub_key["bia"]);
    PersonaPGP.verifyPubKey(bia_pub_key,function(outcome,pgp_pub_key){
      if (outcome === true){
        localforage.setDriver('localStorageWrapper',function(){
          localforage.getItem('my_contacts',function(data){
            if (email in data){
              data[email].push(pgp_pub_key);
            } else {
              data[email] = [pgp_pub_key];
            }
            localforage.setItem('my_contacts',data,function(){
              callback(true);
            });
          });
        });
      } else {
        callback(false);
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
   * @param {bia_pub_key} A bia and signed pgp public key to be verified.
   */
  verifyPubKey: function(bia_pub_key,callback){
    PersonaId.verifyPayload(bia_pub_key,function(outcome,key){
      if (outcome === true){
        //console.log("Signature on PGP key is valid");
        var bia = bia_pub_key[0];
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

  /**
   * This function encrypts the plaintext with the passed in pubKeys
   **/
  encryptHelper: function(plaintext,pubKeys,callback){
    // Here we convert the plaintext into a json string. We do this to
    // check if the decryption occured with the correct string.  If it's
    // formated as json it is extremely unlikely to have been decrypted
    // with the wrong key.  There are mechanisms built into OpenPGP.js that
    // allow you to know in advance if you posses the appropriate key for
    // decryption. However, this means revealing the identity of your
    // intended recipient. Converting to json will (eventually) allow us to
    // preserve the identity of recipients.
    var plaintext_as_json = JSON.stringify({message: plaintext});

    var ciphertext = openpgp.encryptMessage(pubKeys,plaintext_as_json);
    callback(ciphertext);
  },

  /**
   * This function uses openpgpjs to encrypt a message as json.
   *
   * @param {pubKeys} keys An array of key objects that should be able to be
   * used to decrypt the message.
   * @param {plaintext} plaintext The message being encrypted.
   */
  encrypt: function(emails,plaintext,callback){
    // TODO:Check if additional arguments have been passed,
    // sign and encrypt if private key passed or just encrypt if not.
    // For now, not signing messages.
    var pubKeys = [];
    var completed = [];
    var getPublicKeys = function(i){
      PersonaPGP.findPubKey(emails[i],function(Keys){
        if (typeof Keys === "object"){
          for(var j = 0; j < Keys.length; j++){
            var pub_key = openpgp.key.readArmored(Keys[j]).keys[0];
            pubKeys.push(pub_key);
          }
        }
        completed.push(emails[i]);
        if (completed.length === emails.length){
          PersonaPGP.encryptHelper(plaintext,pubKeys,callback);
        }
      });
    };

    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('email',function(my_email){
        emails.push(my_email); // so you can view your own messages
        for (var i = 0; i < emails.length; i++){
          getPublicKeys(i);
        }
      });
    });
  },

  /**
   * This function uses openpgpjs to decrypt a json encoded message.
   *
   * @param {ciphertext} ciphertext The message being decrypted.
   */
  decrypt: function(ciphertext,callback){
    var encrypted_message = openpgp.message.readArmored(ciphertext);
    var keyids = encrypted_message.getEncryptionKeyIds();

    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(my_keys){
        if (my_keys.length === 0 || my_keys === null){
          callback("No private keys found. Failed to decrypt.");
        }
        var emails = Object.keys(my_keys);
        for(var i = 0; i < emails.length; i++){
          for(var j = 0; j < my_keys[emails[i]].length; j++){
            var privKey = openpgp.key.readArmored(
                            my_keys[emails[i]][j].privateKeyArmored).keys[0];
            // hard coded passphrase for now
            // TODO: get passphrase from user 
            var success = privKey.decryptKeyPacket(keyids,"passphrase");
            if (success === true){
              var message = PersonaPGP.decryptHelper(privKey,encrypted_message);
              if (message !== "next"){ // decrypted successfully
                callback(message);
              } else if ( i === (emails.length - 1) &&
                          j === (my_keys[emails[i]].length -1) ) {
                callback("The data cannot be viewed with your keys.");
              }
            } else {
              if ( i === (emails.length - 1) &&
                   j === (my_keys[emails[i]].length -1) ) {
                callback("The data cannot be viewed with your keys.");
              }
            }
          }
        }
      });
    });
  },

  /**
   * This function helps to decrypt a json encoded message. It verifies that
   * the decrypted contents of the message is in json format. If a keyid is
   * not included in a message, this is the only way to know with certainty
   * if the decryption occurred with the correct key.
   *
   * @param {Private Key} privKey The key to attempt to decrypt the message
   * with.
   * @param {Decoded Message} encrypted_message The dearmored ciphertext.
   */

  decryptHelper: function(privKey,encrypted_message){
    // Should determine if message is signed or not, and use appropriate
    // decryption method accordingly. If it is signed, find public key and
    // then verify signature.
    // For now assuming message is not signed.
    var decryptFailedMsg = "The data behind this link cannot be" +
                                 " decrypted with your key.";
    var cleartext = openpgp.decryptMessage(privKey,encrypted_message);
    var message = null;
    if (cleartext == null){
      console.log("Decrypted cleartext is null or undefined");
      return "next";
    }
    try { // try to parse cleartext as json object
      message = JSON.parse(cleartext);
    } catch(e) {
      message = JSON.parse('{"message":' + "'" + decryptFailedMsg + "}'");
    }

    if (message.message !== decryptFailedMsg){
      return message.message;
    } else {
      // TODO: make this more robust
      // figure out a better solution long term. currently this prevents
      // sending a message consisting only of "next".
      return "next";
    }
  }
};
