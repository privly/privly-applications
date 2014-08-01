/**
 * @fileOverview A set of functions for dealing with Directory Provider
 * payloads and their fields.
 *
 * The payload from/to a DP follows this structure:
 * {
 *   pgp: A PGP public key signed by a Persona secret key. This is also
 *        referred to as just the 'signature'.
 *   email: The email associated with the PGP key. This is a temporary
 *          solution to the directory provider only accepting values,
 *          not keys.
 * }
 *
 * 'bundle' is used to create this payload.
 **/
var jwcrypto = require('/lib/jwcrypto');
require('/lib/algs/ds');

// TODO: jwcrypto requires some form of entropy when signing. Make sure
// the RNG is seeded, or you call `jwcrypto.addEntropy` before using
// functions `sign` or `bundle`.

// TODO: We need to determine how to autoseed jwcrypto
// before putting this into production without a hardcoded
// initialization vector.

/**
 * The functions of PersonaId
 *
 * 1. bundle: Creates the payload to be uploaded to a directory.
 * 2. sign: Signs an object with a private key.
 * 3. verify: Checks the signature on the passed in object.
 * 4. verifyPayload: Extracts the signed pgp key from the payload and verifes
 *      the signature.
 * 5. extractPubkey: Extracts the public key from a backed identity assertion.
 * 6. extractField: Extracts an arbitrary field from a backed identity
 *      assertion.
 * 7. extractEmail: Extracts the email from a backed identity assertion.
 * 8. remotelyVerifyBia: Call out to Persona's remote verifier to check
 *      validity of the backed identity assertion.
 * 9. getSecretKeyFromBridge: Extract a secret from the persona-bridge object.
 **/
var PersonaId = {

  /**
   * Create a payload to send to the directory provider.
   *
   * @param {object} pubkey A PGP public key.
   * @param {object} secretkey A Persona secret key.
   * @param {string} email Email address associated with the PGP key.
   **/
  bundle: function(pubkey, secretkey, email, callback) {
    this.sign(pubkey, secretkey, function(err, signature) {
      callback({"pgp": signature, "email": email});
    });
  },

  /**
   * Sign a PGP public key with a Persona secret key.
   *
   * @param {object} pubkey A PGP public key.
   * @param {object} secretkey A Persona secret key.
   * @param {function} callback The function that should be run after jwcrypto
   * signs the pubkey.
   **/
  sign: function(pubkey, secretkey, callback) {
    // jwcrypto.sign never returns an error so we can ignore it.
    jwcrypto.sign({"key": pubkey}, secretkey, callback);
  },

  /**
   * Verify that a signature for a PGP key is correct, and extract the
   * PGP key from the payload.
   *
   * @param {object} signedObject The object returned from the 'sign' function.
   * @param {object} pubkey The Persona public key, whose pair was used to sign
   * the signedObject.
   * @param {function} callback The function that should be run after jwcrypto
   * verifies the signed object. The function should accept an error and the
   * payload key as parameters.
   **/
  verify: function(signedObject, pubkey, callback) {
    jwcrypto.verify(signedObject, pubkey, function(err, payload) {
      callback(err, payload.key);
    });
  },

  /**
   * Verify that a directory provider payload contains a PGP public
   * key signature that was signed by the public key contained within
   * the backed identity assertion (bia) within the payload.
   *
   * @param {object} payload The payload from a directory provider that
   * contains a signed pgp key and bia.
   * @param {function} callback The function that should be run after jwcrypto
   * verifies the payload. The function should accept a boolean and the key or
   * null as parameters.
   **/
  verifyPayload: function(payload, callback) {
    var bia_pubkey = this.extractPubkey(payload.bia);
    this.verify(payload.pgp, bia_pubkey, function(err, key) {
      if (err == null) {
        callback(true,key);
      } else {
        callback(false,null);
      }
    });
  },

  /**
   * Extract a Persona public key from a backed identity assertion
   * (bia).
   *
   * @param {object} bia The backed identity assertion containing the public
   * key. This is assumed to be verified.
   **/
  extractPubkey: function(bia) {
    var pubkey_obj = this.extractField(bia, 'public-key');
    var pubkey = jwcrypto.loadPublicKeyFromObject(pubkey_obj);
    return pubkey;
  },

  /**
   * Extract a field from the Backed Identity Assertion certificate.
   *
   * @param {object} bia The backed identity certificate.
   * @param {string} field The field to extract from bia.
   */
  extractField: function(bia, field) {
    var bundle = jwcrypto.cert.unbundle(bia);
    // Assuming there is only ever one cert is a bad assumption, but
    // it will hold for now.
    // TODO: Verify Persona never uses multiple certs.
    var cert = bundle.certs[0];

    var extracted_field  = jwcrypto.extractComponents(cert).payload[field];

    return extracted_field;
  },

  /**
   * Extract the email address from a backed identity assertion (bia).
   *
   * @param {object} bia The backed identity assertion containing the public
   * key. This is assumed to be verified.
   **/
  extractEmail: function(bia) {
    var principal = this.extractField(bia, "principal");
    var email = principal['email'];
    return email;
  },

  /**
   * Calls out to Persona's remote verifier to assure the public key is signed. 
   * Long term this functionality should be implemented to run locally.
   * This will remove the need to trust the remote verifier.
   *
   * @param {object} bia The backed identity assertion to be verified.
   * @param {function} callback The function that should be run after getting a
   * response from the remote verifier. The function should accept a boolean as
   * a parameter.
   **/
  remotelyVerifyBia: function(bia,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('pgp-directoryURL',function(audience){
        audience += ":443";
        $.post(
          "https://verifier.login.persona.org/verify",
          {assertion: bia, audience: audience}
        ).done(function(response){
          if (response.status === "okay"){
            callback(true);
          } else {
            console.log("Verification failed because: " + response.reason);
            callback(false);
          }
        }
        ).fail(function(response) {
          console.log("Status 200 was not returned from persona verifier");
          callback(false);
        });
      });
    });
  },

  /*
   * Extract a secret key from the person-bridge object.
   *
   * @param {object} bridge The bridge containing persona details such as
   * secret key, public key, and email for a user.
   * @param {string} email The email associated with key to be extracted.
   **/
  getSecretKeyFromBridge: function(bridge, email) {
    var emails = JSON.parse(bridge.emails);
    if (Object.keys(emails).length == undefined || // Empty object
             emails.default[email] == undefined) { // No email key
      return null;
    }
    var priv = emails.default[email].priv;
    var secretkey = jwcrypto.loadSecretKeyFromObject(priv);
    return secretkey;
  }
};
