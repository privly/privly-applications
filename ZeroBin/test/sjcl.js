/**
 * @fileOverview sjcl.js Gives sanity checking code for the SJCL cryptography
 * library. None of these tests check the cryptographic strength of the
 * output.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("SJCL sanity check suite", function() {
  
  it("has sufficient entropy", function() {
    expect(sjcl.random.isReady()).toBeGreaterThan(1);
  });
  
  it("does not quickly generate duplicate keys", function() {
    //note, this is not a strong test of randomness, it is a basic check of
    //sanity
    var keys = [];
    for(var i = 0; i < 100; i++) {
      var key = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
      expect(keys).not.toContain(key);
      keys.push(key);
    }
  });
  
});
