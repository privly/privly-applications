describe("Backed Identity Tests", function() {
  var pubkey = jwcrypto.loadPublicKeyFromObject({"algorithm":"DS","y":"6782618651cac913aa9e8426d1207852d1ff3ec2d69006a638b117f369f0f67de9080eb41c229494c28615cdb4eb344825f70f9ec1870674b36101f40662c26d46244b9c34901d28c4838a25a76ca9453d04f4cde12ceb44f429b3fa6468f04a99d4e1b0d6a9c6f7382ef84fa2d8c4450bc935ed3af6e367ba71ceca118e2ca6","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});
  var privkey = jwcrypto.loadSecretKeyFromObject({"algorithm":"DS","x":"287684814783ed02bb002a1345f75d53e08d828f","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});
  var cert = "eyJhbGciOiJSUzI1NiJ9.eyJwdWJrZXkiOnsia3R5IjoiRFNBIiwieSI6ImN5QjYxN2RaZV9JN00yTnlCWFFTMHBaTkw5OGhHNmwwNmZoMnNON0ZIakNrbjlxSzY5a2UtSDA2eHhTNm9Oa3o3TXBNcTFsQ1k3VnIwczBNQ09GUFBGSTVsemxlREpQRUhGZXF0WG9Ca3phMjJpNnprRmFWbC1RaXdYMGhha3d4YXl1NnhiQ2tiOW1JQ0VBU1hLQ0Q3SjgzT0JUVHJQS3hDR3BTeWJGS01rYyIsInAiOiJfMkFFZzl0cXY4VzBYcXQ0V1VzMU05VlEyZkdfS3BrcWVvMnFiY05QZ0VXdFRtNE1RcDB6VHU2cTc5ZmlQVWdRdmdEa3pCU1N5Nk1sdW9IX0xWcGJNRnFORi1zNzlLQnFOSjA1TGdEVEtYUktVWGs0QTBUb0toakVlVE5EajRrZUlxN3ZnUzFweVBkZU1teTNEcUFBd19kMjM5dldCR09NTHZjWF9DYlFMaGMiLCJxIjoiNGg0RS1SSFI3WG1SQUk3S3F6djNkWmhEQ2NNIiwiZyI6InhTcEtEX08zNWhfZkdHZk9oQk9EYWFZVlQwcjZrcFp1UElKLUpjLW16MUNMa09YZVFaNFROLUI2THA0cVBOWGVwd1RSZGZqcjlxODVmV25oRUxscS14ZkhvREpaTXA1SUtiRFFPN3g0bHJGYlN0NVQ0VENGak1OTmxpYWFxSkJCOUFrVGJISkNvNGlWeWRXOHl0VHppYThkZWt2Uk9ZdlFjdF82aVdJek9YbyJ9LCJwdWJsaWNLZXkiOnsibmV3Rm9ybWF0Ijp0cnVlLCJ5Ijp7Il9iaWdpbnQiOnt9fSwia2V5c2l6ZSI6MTI4LCJxIjp7Il9iaWdpbnQiOnt9fSwiZyI6eyJfYmlnaW50Ijp7fX0sInAiOnsiX2JpZ2ludCI6e319LCJhbGdvcml0aG0iOiJEU0EifSwicHJpbmNpcGFsIjp7ImVtYWlsIjoidXNlckBtb2NrbXlpZC5jb20ifSwiaWF0IjoxMzk3MzEwNjcxLCJleHAiOjEzOTczMTA2NzcsImlzcyI6Im1vY2tteWlkLmNvbSJ9.LWvUJAp4Gyyem7Crn57dTiZnbjb4aO1wraJU9-D9K0cJSpN4U2vnGIAQ7mu5t0qyl6_JfVv6Y5lOphCaY1WScImc-G0HyAYuzN4487ZobnmcSVHHbjbjnBn9WMntf9U2RHJaf5cgqZLP1i8jwAOD50OTiMd2SLAihWau2Yt6UdjDTR8qosD1_u80I16t_jOQNyNViCc0cMntnD5RbnNuHUHvxEjX56sYJK1B-At9y4BJDEb2zYmROBHTQJsw7O5R-TpkcwavOokDOUeJIFPzGD0k1GUrz8ayt4D349rtTVZhGmusJBM4u4Gp5OoTBivsUNHu6aIxYGpFPeGll7kURw";

  it('should generate a cert that has the audience privlyalpha', function() {
    PersonaId.generateBackedIdentityAssertion(cert, privkey, function(err, cert) {
      obj = jwcrypto.cert.unbundle(cert);
      payload = jwcrypto.extractComponents(obj.signedAssertion).payload;
      expect(payload.aud).toEqual('https://privlyalpha.org:443');
    });
  });

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
