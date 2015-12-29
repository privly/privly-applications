/**
 * @fileOverview Testing the model layer of Message App.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach */
/*global Privly, privlyNetworkService */
describe("Privly.app.model.Message", function () {

  beforeEach(function () {
    privlyNetworkService.platformName = function () {
      return "NOT HOSTED";
    };
  });

  it("processes Urls", function (done) {
    var app = new Privly.app.model.Message();
    Privly.storage.remove('Message:URLs');
    app.randomkey = 'kjflksjflakjfs=';
    app.postprocessLink('http://dev.privly.org/lksdjfslkfjd').then(function (url) {
      expect(url).toBe('http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D');
      done();
    });
  });

  it("stores key to localStorage", function () {
    var app = new Privly.app.model.Message();
    Privly.storage.remove('Message:URLs');
    app.storeUrl('http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D');
    expect(Privly.storage.get('Message:URLs')[0]).toBe('http://dev.privly.org/lksdjfslkfjd#privlyLinkKey=kjflksjflakjfs%3D');
  });

  it("recovers key from localStorage", function () {
    var app = new Privly.app.model.Message();

    // Run test
    var url = "https://priv.ly/test/show?fu=bar";
    Privly.storage.set("Message:URLs", [url + "#privlyLinkKey=testKey"]);
    expect(app.resolveKeyFromHistory(url)).toBe('testKey');

    // Try something more confusing
    Privly.storage.set("Message:URLs", ["AAA", "AAA", url + "#privlyLinkKey=testKey"]);
    expect(app.resolveKeyFromHistory(url)).toBe('testKey');
  });

  it("does not recover key from localStorage", function () {
    var app = new Privly.app.model.Message();

    // Run test
    var url = "https://priv.ly/test/show?fu=bar";
    Privly.storage.set("Message:URLs", ["#privlyLinkKey=testKey"]);
    expect(app.resolveKeyFromHistory(url)).toBe(false);

    // Try something more confusing
    url = "https://test.com/fu/bar?fubar=hello_world";
    Privly.storage.set("Message:URLs", ["||", "https://faketest.com/fu/bar?fubar=hello_world#privlyLinkKey=testKey"]);
    expect(app.resolveKeyFromHistory(url)).toBe(false);
  });

  it("can encrypt content", function (done) {
    var app = new Privly.app.model.Message();
    app.randomkey = "GMvZYPcobEY2ECzrmXIuDisb7FUo19IKyHCQfNoppno=";
    app.getRequestContent('changed').then(function (json) {
      expect(json.content).toBe('');
      expect(json.structured_content.length).toBe(165);
      done();
    });
  });

  it("can decrypt content", function (done) {
    var app = new Privly.app.model.Message();
    var json = {
      "burn_after_date": "2015-06-20T16:23:11Z",
      "content": "",
      "created_at": "2015-06-19T16:23:11Z",
      "id": 2753,
      "privly_application": "Message",
      "public": true,
      "random_token": "1532f280ec",
      "structured_content": "{\"iv\":\"WXjGNCC58mUL8B9pCFcAPA==\",\"v\":1,\"iter\":1000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"AlNCKZz/nf8=\",\"ct\":\"wHnUBH3xPsVXb94w04Ss+CO/E0xGkDlWoZzzZ32BcbO4QqbZ5tZSDDyKIKvL5Qw3ehXP6A==\"}",
      "updated_at": "2015-06-19T16:23:11Z",
      "user_id": 4,
      "rendered_markdown": "\n",
      "X-Privly-Url": "https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1532f280ec&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F2753.json%3Frandom_token%3D1532f280ec",
      "permissions": {
        "canshow": true,
        "canupdate": true,
        "candestroy": true,
        "canshare": true
      }
    };
    var url = "https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1532f280ec&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F2753.json%3Frandom_token%3D1532f280ec#privlyLinkKey=GMvZYPcobEY2ECzrmXIuDisb7FUo19IKyHCQfNoppno%3D";
    app.loadRawContent(url, json).then(function (plaintext) {
      expect(plaintext).toBe("[link](http://test.privly.org)");
      done();
    });
  });

});
