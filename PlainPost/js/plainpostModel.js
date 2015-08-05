/**
 * @fileOverview This file provides the model layer of Plainpost
 * App. Plainpost App is a simple Privly application that
 * DOES NOT offer any security protection for your content.
 * 
 * It only supports inputing text (which is the default view
 * behaviour as well).
 * 
 * This App only demostrates the overview process of a Privly
 * application for developers.
 *
 * For a more complex sample, take a look at the Message App.
 * For information about the MVC architecture of a Privly App,
 * see Message/js/messageApp.js.
 */ 
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
  if (Privly.app.model.Plainpost !== undefined) {
    return;
  }

  /**
   * The Privly Plainpost Application
   */
  var PlainpostApp = function () {};

  /**
   * The name of the application, will be used to send
   * request.
   *
   * @override
   * @type {String}
   */
  PlainpostApp.prototype.name = 'PlainPost';

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
  PlainpostApp.prototype.getRequestContent = function (raw) {
    return Promise.resolve({
      content: raw,
      structured_content: '',
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
  PlainpostApp.prototype.loadRawContent = function (url, json) {
    return Promise.resolve(json.content);
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
  PlainpostApp.prototype.getTTLOptions = function () {
    return Promise.resolve([
      {text: "1 Day", ttl: "86400"},
      {text: "7 Days", ttl: "604800"},
      {text: "14 Days", ttl: "1209600"},
      {text: "28 Days", ttl: "2419200", default: true},
      {text: "Infinite", ttl: ""},
    ]);
  };

  Privly.app.model.Plainpost = PlainpostApp;

}());
