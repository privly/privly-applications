This injectable application is provided as the most simplistic 
example of a Privly PGP injectable application.
It provides encryption and decryption functionality for a user's post.

The library used for encryption and decryption is openpgpjs library.(http://openpgpjs.org/)

To test the PGPEncrypt and PGPDecrypt functions a separate folder Test has been included. 
To test These functions follow the following steps: 
1. Use generate.html to generate a key pair. 
2. Use test.html to test if the PGPEncrypt and PGPDecrypt functions are working properly.
3. The functions (PGPEncrypt and PGPdecrypt)in test.html are exact copy of those used in 
the injectable application files new.js and show.js. These can be updated and tested 
separately.