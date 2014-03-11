This is an implementation of PGP as a Privly application. For more information
on what Privly is, see [Priv.ly](https://priv.ly). For information on how we
are using PGP, read about [injectable
applications](https://github.com/privly/privly-organization/wiki/Injectable-Applications).

------------------------------------------------------------------------------


=== THIS IS PRE-ALPHA SOFTWARE - USE AT YOUR OWN RISK ====

Currently the app supports basic encryption/decryption of content posted and
retrieved from a content server. This is currently done with keys read from
localforage. Key management is currently being implemented. Note that the key
generation and upload to the directory provider happens in the Login app.

Tests are written for OpenPGP.js in the Privly context that confirm correctness
of the encryption, key generation, and signing and verification of encrypted
messages. Basic tests for the personapgp functions are outlined but not
implemented.

Note that some of the functions in pgp/js/personapgp.js are not currently being
called from any part of the code. These functions include: findPubKeyRemote,
addRemoteKeyToLocal, and verifyPubKey. These functions are not currently called
because the remote resources are not yet mature. The basic ideas they implement
should be sound, but have not been tested.


### Current TODO
- Sign and encrypt messages (currently the app just encrypts without 
      signing)
- Verify signatures when decrypting messages
- Generate a backed identity assertions in browser
- Sign a PersonaPGP key with the public key found in a backed identity 
      assertion
- Upload backed identity assertion and PersonaPGP to the directory 
      provider. ( Note that this should happen in the Login app )
- Verify a returned back identity assertion and signature
- Implement tests that are already outlined


### Storage
Storage of keys is handled using
[localForage](https://github.com/mozilla/localForage). This is because local
Storage is not currently supported across all browsers and platforms.
localForage acts as a shim that provides support on [all
platforms](https://hacks.mozilla.org/2014/02/localforage-offline-storage-improved/).

The data that is stored in localforage is of two types. Your own keypairs, and
the public keys of your contacts.

```
{ 
  my_keypairs: { email: [keypairs]    },
  my_contacts: { email: [public keys] }
}
```

In other words, localforage is a hash with two entries, `my_contacts` and
`my_keypairs`.  Both entires have values that are a hash where emails are keys
with a corresponding value of an array of public keys or keypairs,
respectively. In the case of your keypairs, the key is naturally your own
email.

### Remote Resources
The remote resources that are involved in this app are: 

  *  A directory provider.  This provides a remote key-value store for public
     keys.
  *  A remote verifier.  This authenticates an email address with a public key.
     Long term the intent is to port the verifier to run locally on the
     browser.
  *  A content server. This provides a location for message storage and
     retrieval. Note that the content server only stores the ciphertext of
     messages. Private keys are created from locally served code, and the 
     private keys never leave the browser.
    
For more details on the protocol for this app, see the
[protocol](https://github.com/privly/privly-applications/blob/experimental-pgp/pgp/protocol.md)
document.

### Getting Started with Development

To get started developing the PGP app in chrome:

1.  Clone the repositories with ```git clone --recursive https://github.com/privly/privly-applications.git```.
1.  Change the branch in privly-chrome to expiremental-apps with
    ```git checkout expiremental-apps```.
1.  Change the branch in privly-applications to expiremental-pgp with
    ```git checkout expiremental-pgp```.
1.  In chrome on the extensions page, check the 'Developer mode' box.
1.  Click load unpacked extension and load your privly-chrome folder.
