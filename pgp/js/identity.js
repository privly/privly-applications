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

jwcrypto.addEntropy("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

// TODO: Fix all indenting
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
    verifyPayload: function(payload) {
        var bia_pubkey = this.extractPubkey(payload.bia);
        this.verify(payload.pgp, bia_pubkey, function(err, pgp_pubkey) {
            if (err !== null)
                return true;
        });
        return false;
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

        var pubkey_obj = jwcrypto.extractComponents(cert).pubkey;
        var pubkey = jwcrypto.loadPublicKeyFromObject(pubkey_obj);

        return pubkey;
    },

}
