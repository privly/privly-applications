describe("OpenPGP tests",function(){

  it("tests for Correctness property",function(){
    var pub_key =
      ['-----BEGIN PGP PUBLIC KEY BLOCK-----',
      'Version: GnuPG v2.0.19 (GNU/Linux)',
      'Type: RSA/RSA',
      '',
      'mI0EUmEvTgEEANyWtQQMOybQ9JltDqmaX0WnNPJeLILIM36sw6zL0nfTQ5zXSS3+',
      'fIF6P29lJFxpblWk02PSID5zX/DYU9/zjM2xPO8Oa4xo0cVTOTLj++Ri5mtr//f5',
      'GLsIXxFrBJhD/ghFsL3Op0GXOeLJ9A5bsOn8th7x6JucNKuaRB6bQbSPABEBAAG0',
      'JFRlc3QgTWNUZXN0aW5ndG9uIDx0ZXN0QGV4YW1wbGUuY29tPoi5BBMBAgAjBQJS',
      'YS9OAhsvBwsJCAcDAgEGFQgCCQoLBBYCAwECHgECF4AACgkQSmNhOk1uQJQwDAP6',
      'AgrTyqkRlJVqz2pb46TfbDM2TDF7o9CBnBzIGoxBhlRwpqALz7z2kxBDmwpQa+ki',
      'Bq3jZN/UosY9y8bhwMAlnrDY9jP1gdCo+H0sD48CdXybblNwaYpwqC8VSpDdTndf',
      '9j2wE/weihGp/DAdy/2kyBCaiOY1sjhUfJ1GogF49rC4jQRSYS9OAQQA6R/PtBFa',
      'JaT4jq10yqASk4sqwVMsc6HcifM5lSdxzExFP74naUMMyEsKHP53QxTF0Grqusag',
      'Qg/ZtgT0CN1HUM152y7ACOdp1giKjpMzOTQClqCoclyvWOFB+L/SwGEIJf7LSCEr',
      'woBuJifJc8xAVr0XX0JthoW+uP91eTQ3XpsAEQEAAYkBPQQYAQIACQUCUmEvTgIb',
      'LgCoCRBKY2E6TW5AlJ0gBBkBAgAGBQJSYS9OAAoJEOCE90RsICyXuqIEANmmiRCA',
      'SF7YK7PvFkieJNwzeK0V3F2lGX+uu6Y3Q/Zxdtwc4xR+me/CSBmsURyXTO29OWhP',
      'GLszPH9zSJU9BdDi6v0yNprmFPX/1Ng0Abn/sCkwetvjxC1YIvTLFwtUL/7v6NS2',
      'bZpsUxRTg9+cSrMWWSNjiY9qUKajm1tuzPDZXAUEAMNmAN3xXN/Kjyvj2OK2ck0X',
      'W748sl/tc3qiKPMJ+0AkMF7Pjhmh9nxqE9+QCEl7qinFqqBLjuzgUhBU4QlwX1GD',
      'AtNTq6ihLMD5v1d82ZC7tNatdlDMGWnIdvEMCv2GZcuIqDQ9rXWs49e7tq1NncLY',
      'hz3tYjKhoFTKEIq3y3Pp',
      '=h/aX',
      '-----END PGP PUBLIC KEY BLOCK-----'].join('\n');

    var priv_key =
      ['-----BEGIN PGP PRIVATE KEY BLOCK-----',
      'Version: GnuPG v2.0.19 (GNU/Linux)',
      'Type: RSA/RSA',
      'Pwd: hello world',
      '',
      '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',
      '=lw5e',
      '-----END PGP PRIVATE KEY BLOCK-----'].join('\n');

    var plaintext = 'short message\nnext line\n한국어/조선말';

    var pubKeys = openpgp.key.readArmored(pub_key);
    var pubKey = pubKeys.keys[0];
    var encrypted = openpgp.encryptMessage([pubKey], plaintext);

    var message = openpgp.message.readArmored(encrypted);

    var privKeys = openpgp.key.readArmored(priv_key);
    var privKey = privKeys.keys[0];
    var pass = "hello world";

    var keyids = message.getEncryptionKeyIds();
    var success = privKey.decryptKeyPacket(keyids,pass);
    expect(success).toBe(true);

    var decrypted = openpgp.decryptMessage(privKey,message);

    expect(decrypted).toEqual(plaintext);
  });

  it("Should generate keys",function(){
    var key = openpgp.generateKeyPair(
                openpgp.enums.publicKey.rsa_encrypt_sign, // integer key type
                512, // bit size of key, using small value to not drain entropy
                "User Name", // user id
                "testing"); // passphrase

    expect(key).toBeDefined(); // toBeDefined compares against undefined
    expect(key.key).toBeDefined();
    expect(key.privateKeyArmored).toBeDefined();
    expect(key.publicKeyArmored).toBeDefined();
  
    var privKeys = openpgp.key.readArmored(key.privateKeyArmored);
    expect(privKeys).toBeDefined();
    expect(privKeys.err).not.toBeDefined();
    expect(privKeys.keys.length).toEqual(1);
    
    var pubKeys = openpgp.key.readArmored(key.publicKeyArmored);
    expect(pubKeys).toBeDefined();
    expect(pubKeys.err).not.toBeDefined();
    expect(pubKeys.keys.length).toEqual(1);
  });

  it("Should sign, encrypt, decrypt, and validate messages",function(){
    var passphrase1 = "testing";
    var key1 = openpgp.generateKeyPair(1,512,"Bob",passphrase1);
    var privkey1 = openpgp.key.readArmored(key1.privateKeyArmored).keys[0];
    var pubkey1 = openpgp.key.readArmored(key1.publicKeyArmored).keys[0];

    var passphrase2 = "testing123";
    var key2 = openpgp.generateKeyPair(1,512,"Alice",passphrase2);
    var privkey2 = openpgp.key.readArmored(key2.privateKeyArmored).keys[0];
    var pubkey2 = openpgp.key.readArmored(key2.publicKeyArmored).keys[0];
    privkey2.decrypt(passphrase2);

    var plaintext = "all the secrets";
    var encrypted = openpgp.signAndEncryptMessage([pubkey1],privkey2,plaintext);
    var message = openpgp.message.readArmored(encrypted);

    var keyids1 = message.getEncryptionKeyIds();
    var success1 = privkey1.decryptKeyPacket(keyids1,passphrase1);

    var decrypted = openpgp.decryptAndVerifyMessage(privkey1,[pubkey2],message);
    expect(decrypted.text).toEqual(plaintext);
  });

  it("Should sign a message",function(){
    
  });

  it("Should verify a signed message",function(){
    
  });

  it("Should allow decryption by all privkeys intended",function(){
    
  });
  it("Should not allow decryption by wrong privkeys",function(){
    
  });

});
