/**
 * @fileOverview A set of functions for dealing with Directory Provider
 * payloads and their fields.
 *
 * The payload from/to a DP follows this structure:
 * {
 *   pgp: A PGP public key signed by a Persona secret key. This is also
 *        referred to as just the 'signature'.
 *   bia: A backed identity assertion, which inherently contains the
 *        public key of the secret key used to generate the 'pgp' field.
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

var PersonaId = {
  /**
   * Create a payload to send to the directory provider.
   *
   * @param {pubkey} A PGP public key.
   * @param {secretkey} A Persona secret key.
   * @param {assertion} Backed Identity Assertion, which contains the
   *                    public key associated with secret key.
   **/
  bundle: function(pubkey, secretkey, assertion, callback) {
    this.sign(pubkey, secretkey, function(err, signature) {
      callback({pgp: signature, bia: assertion});
    });
  },

  /**
   * Sign a PGP public key with a Persona secret key.
   *
   * @param {pubkey} A PGP public key.
   * @param {secretkey} A Persona secret key.
   **/
  sign: function(pubkey, secretkey, callback) {
    // jwcrypto.sign never returns an error so we can ignore it.
    jwcrypto.sign({"key": pubkey}, secretkey, callback);
  },

  /**
   * Verify that a signature for a PGP key is correct, and extract the
   * PGP key from the payload.
   *
   * @param {signedObject} The object returned from the 'sign'
   *                       function.
   * @param {pubkey} The Persona public key, whose pair was used to
   *                 sign the signedObject.
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
   * @param {payload} The payload from a directory provider that
   *                  contains a signed pgp key and bia.
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
   * @param {bia} The backed identity assertion containing the public
   *              key. This is assumed to be verified.
   **/
  extractPubkey: function(bia) {
    var bundle = jwcrypto.cert.unbundle(bia);
    var assertion = bundle.signedAssertion;
    // Assuming there is only ever one cert is a bad assumption, but
    // it will hold for now.
    // TODO: Verify Persona never uses multiple certs.
    var cert = bundle.certs[0];

    var pubkey_obj = jwcrypto.extractComponents(cert).payload['public-key'];
    var pubkey = jwcrypto.loadPublicKeyFromObject(pubkey_obj);

    return pubkey;
  },

  /**
   * Extract the email address from a backed identity assertion (bia).
   *
   * @param {bia} The backed identity assertion containing the public
   *              key. This is assumed to be verified.
   **/
  extractEmail: function(bia) {
    // TODO make this and ExtractPubKey function DRY
    var bundle = jwcrypto.cert.unbundle(bia);
    var assertion = bundle.signedAssertion;
    // Assuming there is only ever one cert is a bad assumption, but
    // it will hold for now.
    // TODO: Verify Persona never uses multiple certs.
    var cert = bundle.certs[0];
    var email = jwcrypto.extractComponents(cert).payload['principal']['email'];

    return email;
  },

  /**
   * Calls out to Persona's remote verifier to assure the public key is signed. 
   * Long term this functionality should be implemented to run locally.
   * This will remove the need to trust the remote verifier.
   *
   * @param {bia} The backed identity assertion to be verified.
   **/
  verifyBia: function(bia,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('directoryURL',function(audience){
        audience += ":443";
        $.post(
          "https://verifier.login.persona.org/verify",
          {assertion: bia, audience: audience}
        ).done(function(response){
          console.log("I'm about to break in PersonaId.verifyBia!");
          console.log("Use the next output to debug");
          console.log(response);
          var data = response.responseText; //JSON object
          if (data.status === "okay"){
            // The data structure is wrong, correct later
            callback(true);
          } else {
            // data.reason is likely wrong
            var reason = data.reason;
            console.log("Verification not okay because" + reason);
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
   * @param {bridge} The bridge containing persona details such as
   * secret key, public key, and email for a user.
   * @param {email} Email associated with key to be extracted.
   **/
  getSecretKeyFromBridge: function(bridge, email) {
    var emails = JSON.parse(bridge.emails);
    var priv = emails.default[email].priv;
    var secretkey = jwcrypto.loadSecretKeyFromObject(priv);
    return secretkey;
  }
};
