var pgp_pubkey =
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

var pubkey = jwcrypto.loadPublicKeyFromObject({"algorithm":"DS","y":"ab7d7709b6431d9ab9576c5e1dbd1101e7426d1aa4f6d3de639905109e8a534d37f5aeee7b4befc36bbb872f188ffe9a378f7f6f3834c57adc0279dada4209f684c108fa467210c9c131d76a0539cdf1f8a1e27083338a7878355f0d5db576e558b8af4ef073ab86c42ef0a5381d655c586e3e104173c682b0823ae544a84abd","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});

var secretkey = jwcrypto.loadSecretKeyFromObject({"algorithm":"DS","x":"abf0aab1097351b140bdfd45454eea002f612de6","p":"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17","q":"e21e04f911d1ed7991008ecaab3bf775984309c3","g":"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a"});

var signature = "eyJhbGciOiJEUzEyOCJ9.eyJrZXkiOiItLS0tLUJFR0lOIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS1cblZlcnNpb246IEdudVBHIHYyLjAuMTkgKEdOVS9MaW51eClcblR5cGU6IFJTQS9SU0FcblxubUkwRVVtRXZUZ0VFQU55V3RRUU1PeWJROUpsdERxbWFYMFduTlBKZUxJTElNMzZzdzZ6TDBuZlRRNXpYU1MzK1xuZklGNlAyOWxKRnhwYmxXazAyUFNJRDV6WC9EWVU5L3pqTTJ4UE84T2E0eG8wY1ZUT1RMaisrUmk1bXRyLy9mNVxuR0xzSVh4RnJCSmhEL2doRnNMM09wMEdYT2VMSjlBNWJzT244dGg3eDZKdWNOS3VhUkI2YlFiU1BBQkVCQUFHMFxuSkZSbGMzUWdUV05VWlhOMGFXNW5kRzl1SUR4MFpYTjBRR1Y0WVcxd2JHVXVZMjl0UG9pNUJCTUJBZ0FqQlFKU1xuWVM5T0Foc3ZCd3NKQ0FjREFnRUdGUWdDQ1FvTEJCWUNBd0VDSGdFQ0Y0QUFDZ2tRU21OaE9rMXVRSlF3REFQNlxuQWdyVHlxa1JsSlZxejJwYjQ2VGZiRE0yVERGN285Q0JuQnpJR294QmhsUndwcUFMejd6Mmt4QkRtd3BRYStraVxuQnEzalpOL1Vvc1k5eThiaHdNQWxuckRZOWpQMWdkQ28rSDBzRDQ4Q2RYeWJibE53YVlwd3FDOFZTcERkVG5kZlxuOWoyd0Uvd2VpaEdwL0RBZHkvMmt5QkNhaU9ZMXNqaFVmSjFHb2dGNDlyQzRqUVJTWVM5T0FRUUE2Ui9QdEJGYVxuSmFUNGpxMTB5cUFTazRzcXdWTXNjNkhjaWZNNWxTZHh6RXhGUDc0bmFVTU15RXNLSFA1M1F4VEYwR3JxdXNhZ1xuUWcvWnRnVDBDTjFIVU0xNTJ5N0FDT2RwMWdpS2pwTXpPVFFDbHFDb2NseXZXT0ZCK0wvU3dHRUlKZjdMU0NFclxud29CdUppZkpjOHhBVnIwWFgwSnRob1crdVA5MWVUUTNYcHNBRVFFQUFZa0JQUVFZQVFJQUNRVUNVbUV2VGdJYlxuTGdDb0NSQktZMkU2VFc1QWxKMGdCQmtCQWdBR0JRSlNZUzlPQUFvSkVPQ0U5MFJzSUN5WHVxSUVBTm1taVJDQVxuU0Y3WUs3UHZGa2llSk53emVLMFYzRjJsR1grdXU2WTNRL1p4ZHR3YzR4UittZS9DU0Jtc1VSeVhUTzI5T1doUFxuR0xzelBIOXpTSlU5QmREaTZ2MHlOcHJtRlBYLzFOZzBBYm4vc0Nrd2V0dmp4QzFZSXZUTEZ3dFVMLzd2Nk5TMlxuYlpwc1V4UlRnOStjU3JNV1dTTmppWTlxVUtham0xdHV6UERaWEFVRUFNTm1BTjN4WE4vS2p5dmoyT0syY2swWFxuVzc0OHNsL3RjM3FpS1BNSiswQWtNRjdQamhtaDlueHFFOStRQ0VsN3FpbkZxcUJManV6Z1VoQlU0UWx3WDFHRFxuQXROVHE2aWhMTUQ1djFkODJaQzd0TmF0ZGxETUdXbklkdkVNQ3YyR1pjdUlxRFE5clhXczQ5ZTd0cTFObmNMWVxuaHozdFlqS2hvRlRLRUlxM3kzUHBcbj1oL2FYXG4tLS0tLUVORCBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tIn0.4Qfd_QxDorWYjdykIFYfRDsaM0HchTeIWiST4DaXrJ8C3b3rlgbZGw";

var bundled = {
  "pgp": "eyJhbGciOiJEUzEyOCJ9.eyJrZXkiOiItLS0tLUJFR0lOIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS1cblZlcnNpb246IEdudVBHIHYyLjAuMTkgKEdOVS9MaW51eClcblR5cGU6IFJTQS9SU0FcblxubUkwRVVtRXZUZ0VFQU55V3RRUU1PeWJROUpsdERxbWFYMFduTlBKZUxJTElNMzZzdzZ6TDBuZlRRNXpYU1MzK1xuZklGNlAyOWxKRnhwYmxXazAyUFNJRDV6WC9EWVU5L3pqTTJ4UE84T2E0eG8wY1ZUT1RMaisrUmk1bXRyLy9mNVxuR0xzSVh4RnJCSmhEL2doRnNMM09wMEdYT2VMSjlBNWJzT244dGg3eDZKdWNOS3VhUkI2YlFiU1BBQkVCQUFHMFxuSkZSbGMzUWdUV05VWlhOMGFXNW5kRzl1SUR4MFpYTjBRR1Y0WVcxd2JHVXVZMjl0UG9pNUJCTUJBZ0FqQlFKU1xuWVM5T0Foc3ZCd3NKQ0FjREFnRUdGUWdDQ1FvTEJCWUNBd0VDSGdFQ0Y0QUFDZ2tRU21OaE9rMXVRSlF3REFQNlxuQWdyVHlxa1JsSlZxejJwYjQ2VGZiRE0yVERGN285Q0JuQnpJR294QmhsUndwcUFMejd6Mmt4QkRtd3BRYStraVxuQnEzalpOL1Vvc1k5eThiaHdNQWxuckRZOWpQMWdkQ28rSDBzRDQ4Q2RYeWJibE53YVlwd3FDOFZTcERkVG5kZlxuOWoyd0Uvd2VpaEdwL0RBZHkvMmt5QkNhaU9ZMXNqaFVmSjFHb2dGNDlyQzRqUVJTWVM5T0FRUUE2Ui9QdEJGYVxuSmFUNGpxMTB5cUFTazRzcXdWTXNjNkhjaWZNNWxTZHh6RXhGUDc0bmFVTU15RXNLSFA1M1F4VEYwR3JxdXNhZ1xuUWcvWnRnVDBDTjFIVU0xNTJ5N0FDT2RwMWdpS2pwTXpPVFFDbHFDb2NseXZXT0ZCK0wvU3dHRUlKZjdMU0NFclxud29CdUppZkpjOHhBVnIwWFgwSnRob1crdVA5MWVUUTNYcHNBRVFFQUFZa0JQUVFZQVFJQUNRVUNVbUV2VGdJYlxuTGdDb0NSQktZMkU2VFc1QWxKMGdCQmtCQWdBR0JRSlNZUzlPQUFvSkVPQ0U5MFJzSUN5WHVxSUVBTm1taVJDQVxuU0Y3WUs3UHZGa2llSk53emVLMFYzRjJsR1grdXU2WTNRL1p4ZHR3YzR4UittZS9DU0Jtc1VSeVhUTzI5T1doUFxuR0xzelBIOXpTSlU5QmREaTZ2MHlOcHJtRlBYLzFOZzBBYm4vc0Nrd2V0dmp4QzFZSXZUTEZ3dFVMLzd2Nk5TMlxuYlpwc1V4UlRnOStjU3JNV1dTTmppWTlxVUtham0xdHV6UERaWEFVRUFNTm1BTjN4WE4vS2p5dmoyT0syY2swWFxuVzc0OHNsL3RjM3FpS1BNSiswQWtNRjdQamhtaDlueHFFOStRQ0VsN3FpbkZxcUJManV6Z1VoQlU0UWx3WDFHRFxuQXROVHE2aWhMTUQ1djFkODJaQzd0TmF0ZGxETUdXbklkdkVNQ3YyR1pjdUlxRFE5clhXczQ5ZTd0cTFObmNMWVxuaHozdFlqS2hvRlRLRUlxM3kzUHBcbj1oL2FYXG4tLS0tLUVORCBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tIn0.uE4FAH7xdvgdSp6UrRwC3tZhg-rKtk46GJ4V7_NeMbZi9BD2O5TYUQ",
  "bia": "eyJhbGciOiJSUzI1NiJ9.eyJwdWJsaWMta2V5Ijp7ImFsZ29yaXRobSI6IkRTIiwieSI6ImFiN2Q3NzA5YjY0MzFkOWFiOTU3NmM1ZTFkYmQxMTAxZTc0MjZkMWFhNGY2ZDNkZTYzOTkwNTEwOWU4YTUzNGQzN2Y1YWVlZTdiNGJlZmMzNmJiYjg3MmYxODhmZmU5YTM3OGY3ZjZmMzgzNGM1N2FkYzAyNzlkYWRhNDIwOWY2ODRjMTA4ZmE0NjcyMTBjOWMxMzFkNzZhMDUzOWNkZjFmOGExZTI3MDgzMzM4YTc4NzgzNTVmMGQ1ZGI1NzZlNTU4YjhhZjRlZjA3M2FiODZjNDJlZjBhNTM4MWQ2NTVjNTg2ZTNlMTA0MTczYzY4MmIwODIzYWU1NDRhODRhYmQiLCJwIjoiZmY2MDA0ODNkYjZhYmZjNWI0NWVhYjc4NTk0YjM1MzNkNTUwZDlmMWJmMmE5OTJhN2E4ZGFhNmRjMzRmODA0NWFkNGU2ZTBjNDI5ZDMzNGVlZWFhZWZkN2UyM2Q0ODEwYmUwMGU0Y2MxNDkyY2JhMzI1YmE4MWZmMmQ1YTViMzA1YThkMTdlYjNiZjRhMDZhMzQ5ZDM5MmUwMGQzMjk3NDRhNTE3OTM4MDM0NGU4MmExOGM0NzkzMzQzOGY4OTFlMjJhZWVmODEyZDY5YzhmNzVlMzI2Y2I3MGVhMDAwYzNmNzc2ZGZkYmQ2MDQ2MzhjMmVmNzE3ZmMyNmQwMmUxNyIsInEiOiJlMjFlMDRmOTExZDFlZDc5OTEwMDhlY2FhYjNiZjc3NTk4NDMwOWMzIiwiZyI6ImM1MmE0YTBmZjNiN2U2MWZkZjE4NjdjZTg0MTM4MzY5YTYxNTRmNGFmYTkyOTY2ZTNjODI3ZTI1Y2ZhNmNmNTA4YjkwZTVkZTQxOWUxMzM3ZTA3YTJlOWUyYTNjZDVkZWE3MDRkMTc1ZjhlYmY2YWYzOTdkNjllMTEwYjk2YWZiMTdjN2EwMzI1OTMyOWU0ODI5YjBkMDNiYmM3ODk2YjE1YjRhZGU1M2UxMzA4NThjYzM0ZDk2MjY5YWE4OTA0MWY0MDkxMzZjNzI0MmEzODg5NWM5ZDViY2NhZDRmMzg5YWYxZDdhNGJkMTM5OGJkMDcyZGZmYTg5NjIzMzM5N2EifSwicHJpbmNpcGFsIjp7ImVtYWlsIjoidXNlckBleGFtcGxlaWRwLmNvbSJ9LCJpYXQiOjEzOTc4NjU3NjUwNTEsImV4cCI6MTM5Nzg2NTc3MTA1MSwiaXNzIjoiZXhhbXBsZWlkcC5jb20ifQ.X5p0XEAIhfC-ShGNX43zyETwqbvdaqZdJmAHm_ZbHnMvNFf4s9VV45IpYIXBfOSKiWmb4L-h9qRtJ0vWbN__XsG23eL4WA9ZdlTDhKKEPg1gNzTa6zo1ryreWMsOIZY9Il5vcKoyCxofspJAQn2NWTvrbJvYfH71cUH2H5l7ONQmLEU9A_hQ1oqlpfDxDLfK380v89UkjGpGWWxBY_2kzXcMDk9n8eZWmmPGcyybklDyaQcZKQmv35XhvxZXAZzKWtBPICQ2NPCPxVzVl224LO254BV4QJuM5zqBUfRxj1EdvgJZksqB1DlA8hC4CHhVv2lTLxuy7J3cFV3HG95gcg~eyJhbGciOiJEUzEyOCJ9.eyJpYXQiOjEzOTc4NjU3NjUwNTEsImV4cCI6MTM5Nzg2NTc3MTA1MSwiYXVkIjoiaHR0cHM6Ly9leGFtcGxlLmNvbSJ9.USbOBEyJs7LFGTYoXDATJGOdz3OvMU4HGtFOian2afOWXw2DMx4Mrg"
};

describe("Signing and Verifying", function() {

  beforeEach(function() {
    jwcrypto.addEntropy("123456789012345678901234567890");
  });

  it('should be able to sign a thing', function() {
    var signed_object;

    PersonaId.sign("a super secret message from outer space!", secretkey, function(err, sig) {
      signed_object = sig;
    });

    waitsFor(function() {
      return (signed_object !== undefined);
    });

    runs(function() {
      expect(signed_object).toBeDefined();
      expect(signed_object.split('.').length).toEqual(3);
    });
  });

  it('should be able to verify a thing', function() {
    var designed_object;

    PersonaId.verify(signature, pubkey, function(err, payload) {
      designed_object = payload;
    });

    waitsFor(function () {
      return (designed_object !== undefined);
    });

    runs(function() {
      expect(designed_object).toBeDefined();
      expect(designed_object).toEqual(pgp_pubkey);
    });
  });

  it('should verify the output of verifying is equal to the input of signing', function() {
    var payload;

    PersonaId.sign(pgp_pubkey, secretkey, function(err, sig) {
      PersonaId.verify(sig, pubkey, function(err, pload) {
        payload = pload;
      });
    });

    waitsFor(function() {
      return (payload !== undefined);
    });

    runs(function() {
      expect(payload).toBeDefined();
      expect(payload).toEqual(pgp_pubkey);
    });
  });
});


describe("Bundling and Unbundling", function() {

  beforeEach(function() {
    jwcrypto.addEntropy("123456789012345678901234567890");
  });

  it('should bundle a pubkey and email together', function() {
    var bundle;

    PersonaId.bundle(pgp_pubkey, secretkey, "foo@example.com", function(payload) {
      bundle = payload;
    });

    waitsFor(function() {
      return (bundle !== undefined);
    });

    runs(function() {
      expect(bundle).toBeDefined();
      expect(bundle.email).toBeDefined();
      expect(bundle.pgp).toBeDefined();
      expect(bundle.email).toEqual("foo@example.com");
    });
  });

  it('should verify a full payload', function() {
    var valid;

    PersonaId.verifyPayload(bundled, function(validity) {
      valid = validity;
    });

    waitsFor(function() {
      return (valid !== undefined);
    });

    runs(function() {
      expect(valid).toBeDefined();
      expect(valid).toEqual(true);
    });
  });

  it('should extract a Persona public key from a bia', function () {
    var extracted_pubkey = PersonaId.extractPubkey(bundled.bia);
    expect(extracted_pubkey).toBeDefined();
    expect(extracted_pubkey).toEqual(pubkey);
  });
});
