/*
 * Generate a Backed Identity Assertion
 */
var jwcrypto = require('/lib/jwcrypto');
require('/lib/algs/ds');

AUDIENCE = "https://privlyalpha.org:443"
EXPIRATION_LIMIT = (60 * 60 * 24 * 30); // 1 Month

jwcrypto.addEntropy("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

/*
 * Takes a User Certificate (identity cert), a secretkey, and a
 * callback.
 *
 * The secret key is the user's not root certificate signer's
 */
var generateBackedIdentityAssertion = function(cert, secretkey, cb) {
    var ISSUED_AT = new Date();
    var EXPIRES_AT = new Date(new Date().valueOf() + EXPIRATION_LIMIT);
    jwcrypto.assertion.sign({},
      {expiresAt: EXPIRES_AT, issuedAt: ISSUED_AT,
       audience: AUDIENCE},
       secretkey,
      function(err, assertion) {
        cb(err, jwcrypto.cert.bundle(cert, assertion));
      }
    );
};
