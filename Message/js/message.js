/*global sjcl, zeroCipher,zeroDecipher,pageKey */
/*global Promise, privlyNetworkService, privlyParameters */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}
if (Privly.app === undefined) {
  Privly.app = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.app.Message !== undefined) {
    return;
  }

  /**
   * The Privly Message Application
   */
  var MessageApp = function () {};

  /**
   * Generate a random key
   */
  MessageApp.prototype.generateRandomKey = function () {
    this.randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
  };

  /**
   * The name of the application, will be used to send
   * request.
   *
   * @override
   * @type {String}
   */
  MessageApp.prototype.name = 'Message';

  /**
   * Get structured content of the application.
   *
   * @override
   * @param  {String} raw User input content
   * @return {Promise<Object>}
   *           {String} content
   *           {String} structured_content
   *           {Boolean} isPublic
   */
  MessageApp.prototype.getRequestContent = function (raw) {
    return Promise.resolve({
      content: '',
      structured_content: zeroCipher(this.randomkey, raw),
      isPublic: true
    });
  };

  /**
   * Get the raw User input content from a structured content
   *
   * @override
   * @param  {String} url The privly link
   * @param  {Object} structured_content
   * @return {Promise<String>}
   */
  MessageApp.prototype.loadRawContent = function (url, structured_content) {
    var key = privlyParameters.getParameterHash(url).privlyLinkKey;
    if (key === undefined || key === '') {
      key = this.resolveKeyFromHistory(url);
    }
    if (!key) {
      return Promise.reject('You do not have the key required to decrypt this content.');
    }
    this.randomkey = pageKey(key);
    var cleartext = zeroDecipher(this.randomkey, structured_content);
    return Promise.resolve(cleartext);
  };

  /**
   * Process the link that Privly server returns.
   *
   * @override
   * @param  {String} url
   * @return {Promise<String>} The processed url
   */
  MessageApp.prototype.postprocessLink = function (url) {
    // append random key
    if (url.indexOf("#") > 0) {
      url = url.replace("#", "#privlyLinkKey=" + encodeURIComponent(this.randomkey));
    } else {
      url = url + "#privlyLinkKey=" + encodeURIComponent(this.randomkey);
    }
    return Promise.resolve(url);
  };

  /**
   * Attempt to find the key in local storage and redirect the app if
   * possible to the URL with the key.
   *
   * @param  {String} url
   * @return {String|false} Returns the key or false if not found
   */
  MessageApp.prototype.resolveKeyFromHistory = function (url) {
    var i;
    var urls = Privly.storage.get("Message:URLs");

    // Deprecated
    var oldUrls = Privly.storage.get("ZeroBin:URLs");
    if (oldUrls !== null) {
      urls = urls.concat(oldUrls);
      Privly.storage.set("Message:URLs", urls);
      Privly.storage.remove("ZeroBin:URLs");
    }

    if (urls !== null) {
      for (i = 0; i < urls.length; i++) {
        if (urls[i].indexOf(url) === 0) {
          return privlyParameters.getParameterHash(urls[i]).privlyLinkKey;
        }
      }
    }
    return false;
  };

  /**
   * Store the Privly url to the local storage, for decryption
   * when reading in History.
   * 
   * @param  {String} url
   */
  MessageApp.prototype.storeUrl = function (url) {
    if (privlyNetworkService.platformName() === 'HOSTED') {
      return;
    }
    var urls = Privly.storage.get("Message:URLs");
    if (urls === null) {
      urls = [];
    }
    urls.push(url);
    Privly.storage.set("Message:URLs", urls);
  };

  /**
   * Remove the Privly url from the local storage.
   * 
   * @param  {String} url
   */
  MessageApp.prototype.removeUrl = function (url) {
    if (privlyNetworkService.platformName() === 'HOSTED') {
      return;
    }
    var urls = Privly.storage.get("Message:URLs");
    if (urls === null) {
      return;
    }
    var i;
    for (i = urls.length - 1; i >= 0; --i) {
      if (urls[i] === url) {
        urls.splice(i, 1);
      }
    }
    Privly.storage.set("Message:URLs", urls);
  };

  /**
   * Get the TTL options for this App
   * 
   * @return {Promise<[Object]>}
   *   {String} text     The text of the option
   *   {String} ttl      The seconds_util_burn value of the option
   *   {Boolean} default Whether this option is the default option
   */
  MessageApp.prototype.getTTLOptions = function () {
    return Promise.resolve([
      {text: "1 Day", ttl: "86400"},
      {text: "7 Days", ttl: "604800"},
      {text: "14 Days", ttl: "1209600"},
      {text: "28 Days", ttl: "2419200", default: true},
      {text: "Infinite", ttl: ""},
    ]);
  };

  Privly.app.Message = MessageApp;

}());
