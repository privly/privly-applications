/**
 * @fileOverview Testing the model layer of Plainpost App.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach */
/*global Privly, privlyNetworkService */
describe("Privly.app.model.Plainpost", function () {

  beforeEach(function () {
    privlyNetworkService.platformName = function () {
      return "NOT HOSTED";
    };
  });

  it("can load content", function (done) {
    var app = new Privly.app.model.Plainpost();
    var mkdwn = "[link](http://test.privly.org)";
    var json = {
      content: mkdwn
    };
    app.loadRawContent('', json).then(function (plaintext) {
      expect(plaintext).toBe(mkdwn);
      done();
    });
  });

});
