/**
 * @fileOverview This file provides the model layer of Message
 * App. Message App is a simple Privly application that supports
 * text encryption.
 *
 * Fore more details about the Message App, please visit Privly
 * website.
 *
 * About the MVC architecture of the Privly application:
 * 
 *   An interactive Privly application can be splitted into
 *   three parts: Model, View, Controller.
 *
 *   First of all, let's determine different use cases of a
 *   Privly app. Generally, a Privly app has three use cases:
 *   
 *   1) show
 *      When the link is embedded into a host page, this
 *      application will be embedded to the host page to present
 *      the content of the link. This is the `show` case.
 *      
 *   2) new
 *      When user clicks `new` button in a browser action button,
 *      or in a context menu, or in the Privly navigation bar, this
 *      application will be shown to user, allowing user to create
 *      such kind of content. In this case, it is `new`.
 *      About editing an existing content, it should be categorized
 *      to `new` case. However due to historical issue (?), it is
 *      now charged by the `show` case.
 *
 *   3) seamless
 *      We introduced a new method of creating content: seamless-
 *      posting. For `new` case, the users are creating content in
 *      a saparated, standalone window, and the content is created
 *      when users click 'Save' button. However in `seamless` case,
 *      the users are creating content seamlessly in the host page.
 *      Besides, the content is created once users enter `seamless`
 *      mode, and will be frequently updated or finally deleted.
 *      In short, in `seamless` case, the user is going to create
 *      the content using the Privly App, just inside the host page.
 *
 *   Now let's see what are the MVC of a Privly application.
 *
 *   VIEW LAYER
 *   ==========
 * 
 *   The view layer is the user interface layer. Currently we have
 *   three view prototypes: show, new and seamless. Yes as you can
 *   see, these three view prototypes provide templates for the 
 *   three use cases. We offer templates for App developers, to
 *   allow faster App development. However those templates are
 *   free to be inherited, extended or overridden so it is still
 *   flexable. For example, our `show` view prototype provides a
 *   textarea for users to input contents. However you can override
 *   that part of the template to allow users dragging image into
 *   it.
 *
 *   Notice that, if your App supports `seamless` view, it should
 *   also provides a `seamless_ttlselect` view, used to display
 *   seconds_until_burn menu for user. If you don't want to change
 *   menu styles, or change menu orders, using our default
 *   prototype is enough for your App.
 *
 * 
 *   MODEL LAYER
 *   ===========
 *   
 *   The model layer handles such basic tasks below:
 *   
 *   - How should the user inputted content in the view layer be
 *     transformed into a Privly json object? This task is used
 *     in publishing or editing the content.
 *
 *     Example:
 *     For Plainpost App, no transformations.
 *     For Message App, the transformation is encryption.
 *     For Image App (not existed yet), the transformation is
 *     binary serialization and encryption.
 *     
 *   - How should we transform a Privly json object to the content
 *     that the view layer can present? This task is just a reserve
 *     situation of the task above. It is used when user is going
 *     to see the content (`show` case).
 *
 *     For example, for Message App, the transformation is decryption
 *     according to the encryption key attached in the link.
 *
 *   - What are the `seconds_until_burn` options for this App? An
 *     app can assign its own seconds_until_burn (aka. TTL, Time
 *     To Live) option items.
 *
 *   Notice that the model part can provide other interfaces as well.
 *   Generally those interfaces are useful in the controller layer.
 *
 *   Also please notice that, generally all interfaces of the model
 *   layer should be async, by returning a Promise which will later
 *   be resolved. The async feature of a model doesn't have much
 *   effect in current Privly Application like Message and Plainpost,
 *   however it does offer developers more flexibility.
 *   
 * 
 *   CONTROLLER LAYER
 *   ================
 *
 *   Controller layer connects model layer and view layer. It can
 *   offer extra actions for every view layer events, for example,
 *   for a Message App, when a new link is created, we have to concat
 *   the encryption key after the link. Another example is, when
 *   we are presenting the content of a Message App, we should do a
 *   Markdown rendering. This task should also be completed by the
 *   controller layer.
 *
 *   In the Privly application, you needn't explicitly connects
 *   all interface between view and model. You can just pass the
 *   model to the view! The view will call related interface
 *   itself. For a controller, you only need to write initializing
 *   code and write event handlers if you want to change the
 *   default process of a prototype view.
 *   
 * For Message App, the controller layer for each view is:
 *   new:       Message/js/new.js
 *   show:      Message/js/show.js
 *   seamless:  Markdown/js/seamless.js
 *   seamless_ttl: Markdown/js/seamless_ttl.js
 * 
 */
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
if (Privly.app.model === undefined) {
  Privly.app.model = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.app.model.Message !== undefined) {
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
   * Get json content object of the application.
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
   * Get the raw User input content from a response json object
   *
   * @override
   * @param  {String} url The privly link
   * @param  {Object} json
   * @return {Promise<String>}
   */
  MessageApp.prototype.loadRawContent = function (url, json) {
    var key = privlyParameters.getParameterHash(url).privlyLinkKey;
    if (key === undefined || key === '') {
      key = this.resolveKeyFromHistory(url);
    }
    if (!key) {
      return Promise.reject('You do not have the key required to decrypt this content.');
    }
    this.randomkey = pageKey(key);
    var cleartext = zeroDecipher(this.randomkey, json.structured_content);
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
   * @override
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

  Privly.app.model.Message = MessageApp;

}());
