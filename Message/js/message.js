/*global sjcl, zeroCipher */
/*global privlyNetworkService, ls */

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
  var MessageApp = function () {
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
   * Store the Privly url to the local storage, for decryption
   * when reading in History.
   * 
   * @param  {String} url
   */
  MessageApp.prototype.storeUrl = function (url) {
    if (privlyNetworkService.platformName() === 'HOSTED') {
      return;
    }
    var urls = ls.getItem("Message:URLs");
    if (urls === undefined) {
      urls = [];
    }
    urls.push(url);
    ls.setItem("Message:URLs", urls);
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
    var urls = ls.getItem("Message:URLs");
    if (urls === undefined) {
      return;
    }
    var i;
    for (i = urls.length - 1; i >= 0; --i) {
      if (urls[i] === url) {
        urls.splice(i, 1);
      }
    }
    ls.setItem("Message:URLs", urls);
  };

  Privly.app.Message = MessageApp;

}());
