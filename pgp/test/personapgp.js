describe("PersonaPGP tests",function(){

  it("tests findPubKey call when local",function(){
    // add a key to local storage
    // attempt to find that key, return value of call as keyreturned
    // expect(keyreturned).toEqual(key);
    //
    // positive and negative version
  });

  it("tests findPubKeyRemote call",function(){
    // add a key to local redis instance 
    // attempt to find that key, return value of call as keyreturned
    // expect(keyreturned).toEqual(key);
    //
    // positive and negative version
  });

  it("tests findPubKey call when remote",function(){
    // add a key to local redis instance 
    // attempt to find that key, return value of call as keyreturned
    // expect(keyreturned).toEqual(key);
    //
    // positive and negative version
  });

  it("tests addRemoteKeyToLocal call",function(){
    
    // send DirP valid and invalid input, make sure response is as expected
    
  });

  it("tests verifyPubKey call",function(){
    
    // send verifier valid and invalid input, make sure response is as expected
    
  });
  it("tests encrypt call",function(){
    
    // test that ciphertext is returned from cleartext
    // test if message is signed when it should be 
    // test that message is not signed when it shouldn't be
    
  });

  it("tests decrypt call",function(){
    
    // test that cleartext is returned from ciphertext
    // test can sign message
    // test all recipients that should be able to decrypt can
    
  });

  it("tests decryptHelper call",function(){
    
    // test that JSON parsing happens as expected
  });
});
