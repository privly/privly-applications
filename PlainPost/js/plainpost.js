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
  if (Privly.app.Plainpost !== undefined) {
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
   * @return {Object}
   *           {String} content
   *           {String} structured_content
   *           {Boolean} isPublic
   */
  PlainpostApp.prototype.getRequestContent = function (raw) {
    return {
      content: raw,
      structured_content: '',
      isPublic: true
    };
  };

  Privly.app.Plainpost = PlainpostApp;

}());
