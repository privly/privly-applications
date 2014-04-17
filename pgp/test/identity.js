describe("Backed Identity Tests", function() {
  var pubkey = jwcrypto.loadPublicKeyFromObject({"algorithm":"DS","y":"6782618651cac913aa9e8426d1207852d1ff3ec2d69006a638b117f369f0f67de9080eb41c229494c28615cdb4eb344825f70f9ec1870674b36101f40662c26d46244b9c34901d28c4838a25a76ca9453d04f4cde12ceb44f429b3fa6468f04a99d4e1b0d6a9c6f7382ef84fa2d8c4450bc935ed3af6e367ba71ceca118e2ca6","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});
  var privkey = jwcrypto.loadSecretKeyFromObject({"algorithm":"DS","x":"287684814783ed02bb002a1345f75d53e08d828f","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});

  it('should bundle a pubkey and bia together', function() {
    PersonaId.bundle(pubkey, secretkey, assertion, function(payload) {
        expect(payload.bia).toEqual(assertion);
        expect(payload.signature).toEqual(signature);
    });
  });

  it('should sign a pgp public key', function() {
    PersonaId.sign(pubkey, secretkey, function(sig) {
        expect(sig).toEqual(signature);
    });
  });

  it('should verify a signed pgp public key', function() {
    PersonaId.verify(signedPayload, pubkey, function(payload) {
        expect(payload).toEqual({key: pgp_pubkey});
    });
  });

  it('should verify a full payload', function() {
      var valid = PersonaId.verifyPayload(payload);
      expect(valid).toEqual(true);
  });

  it('should extract a Persona public key from a bia', function () {
      var persona_pubkey = PersonaId.extractPubkey(bia);
      expect(persona_pubkey).toEqual(pubkey);
  });
});
