/**
 * @fileOverview 
 * This JavaScript acts as a source for pgp related functionality.
 *
 **/

/**
 * The functions in PersonaPGP
 *
 * 1. Key Search: Check localForage and remote directory for keys associated 
 *    with email address. Should return public key of message recipient.
 *    Callback=findPubKey
 * 2. Verify Public Key: Verifies if a public key is in fact associated with
 *    an email address.
 *    Callback=verifyPubKey
 * 3. Encrypt a message: Converts a message to json and then encrypts it using
 *    openpgp.js.  The conversion to json is used as a method to later ensure
 *    that decryption occurred successfully.  This is needed when the keyid used
 *    to encrypt a message is not disclosed.
 *    Callback=encrypt
 * 4. Decrypt a message: Converts ciphertext into cleartext. As an additional
 *    assurance verifies that decrypted message is valid json.
 *
 */

var PersonaPGP = {
  /**
   * Attempt to find the public key of a given email address.  Looks at local
   * resources before querying remote resources. 
   *
   * @param {email} email The email that the user wants to find the associated 
   * pub key of.
   *
   */
  findPubKey: function(email){
    var pub_keys = null;

    // query localForage 
    localforage.getItem('pubKeys',function(pubkey_email_hash){
      if (email in pubkey_email_hash) {

        pub_keys = [pubkey_email_hash[email]]; 
        return pub_keys; //array of pub keys associated with email

      } else { // not found locally, query DirP
        pub_keys = findPubKeyRemote(email);
        if (pub_keys === null){
          console.log("No public key associated with email found");
          console.log("Invite friend to share privately goes here");
        }
        return pub_keys;
      }
    });
  },

  findPubKeyRemote: function(email){
    var remote_directory = "https://127.0.0.1:10001";
    var pub_keys = null;
    $.get(
      remote_directory,
      {email: email},
      function(response){
        if (response.status === 200) {
          var data = response.responseText;
          if (data !== null) {
            // The format of the response is not currently known.  Once data
            // structure of UC & IA with extra pub key is known, update with
            // appropriate values.
            pub_keys = data; // this line is wrong, update me
            return pub_keys;
          } else {
            return null;
          }
        } else {
          // handle other status responses in the future
          console.log("Response status was not 200");
          return null;
        }
      }
    );
  },

  /**
   * Calls out to the remote verifier to assure the public key is signed. 
   * Long term this functionality should be implemented to run locally.
   * This will remove the need to trust the remote verifier.
   *
   * @param {pub_key} pub_key The public key to be verified.
   */
  verifyPubKey: function(pub_key){

    // data structure assumed may be wrong
    var assertion = findPubKey(pub_key);

    // audience does not matter, the assertion is made public knowledge
    var audience = "https://publicknowledge.com:443";

    $.post(
      "https://verifier.login.persona.org/verify",
      {assertion: assertion, audience: audience},
      function(response){

        if (response.status === 200){
          var data = response.responseText; //JSON object
          if (data.status === "okay"){
            // The data structure is wrong, correct later
            if (assertion.email === data.email){
              return true;
            } else {
              console.log("Email mismatch");
              return false;
            }
          } else {
            // data.reason is likely wrong
            var reason = data.reason;
            console.log("Verification not okay because" + reason);
            return false;
          }
        } else {
          console.log("Status 200 was not returned");
          return false;
        }
      }
    );
  },

  /**
   * This function uses openpgpjs to encrypt a message as json.
   *
   * @param {pubKeys} pubKeys An array of public keys that should be able to 
   * decrypt the message.
   * @param {plaintext} plaintext The message being encrypted.
   *
   */
  encrypt: function(pubKeys,plaintext){
    // TODO:Check if additional arguments have been passed, 
    // sign and encrypt if private key passed or just encrypt if not.
    // For now, not signing messages.
    var plaintext_as_json = JSON.stringify({message: plaintext});
    var ciphertext = openpgp.encryptMessage(pubKeys,plaintext);
    return ciphertext;
  },

  /**
   * This function uses openpgpjs to decrypt a json encoded message.
   *
   * @param {ciphertext} ciphertext The message being decrypted.
   *
   */
  decrypt: function(ciphertext){
    var encrypted_message = openpgp.message.readArmored(ciphertext);
    var keyids = encrypted_message.getEncryptionKeyIds();

    localforage.getItem('my_keypairs',function(keys_to_try){
      if (keys_to_try.length === 0 || keys_to_try === null){
        console.log("No private keys found.  Decryption exiting");
        return "No private keys found. Failed to decrypt.";
      }
      for(var i = 0; i < keys_to_try.length; i++){
        var privKey = openpgp.key.readArmored(
                        keys_to_try[i].privateKeyArmored).keys[0];
        // hard coded passphrase for now
        var success = privKey.decryptKeyPacket(keyids,"passphrase");
        var message = decryptHelper(privKey,encrypted_message);
        if (message !== "next"){ // decrypted successfully
          return message;
        }
        if (i === (keys_to_try.length - 1)) {
          console.log("Tried all available private keys, none worked");
          return "The data behind this lnke cannot be decrypted with your key.";
        }
      }
    });
  },

  decryptHelper: function(privKey,encrypted_message){
    // Should determine if message is signed or not, and use appropriate
    // decryption method accordingly. If it is signed, find public key and
    // then verify signature. 
    // For now assuming message is not signed.
    var decryptFailedMsg = "The data behind this link cannot be" +
                                 " decrypted with your key.";
    var cleartext = openpgp.decryptMessage(privKey,encrypted_message);
    var message = null;

    try { // try to parse cleartext as json object
      message = JSON.parse(cleartext);
    } catch(e) {
      console.log(e.message);
      message = JSON.parse('{"message":' + "'" + decryptFailedMsg + "}'");
    }

    if (message.message !== decryptFailedMsg){
      return message.message;
    } else {
      console.log("Wrong key, trying next one");
      return "next";
    }
  }
}
