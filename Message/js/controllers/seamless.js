/**
 * @fileOverview This is the controller part for the
 * `seamless` use-case of the Message App. To learn more
 * about the MVC architecture of a Privly Application,
 * see Message/js/messageApp.js and Message/js/new.js.
 */
/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.model.Message();
  app.generateRandomKey();
  var adapter = new Privly.app.viewAdapter.Seamless(app);
  adapter.on('afterCreateLink', function (url) {
    app.storeUrl(url);
  });
  adapter.on('afterDeleteLink', function (url) {
    app.removeUrl(url);
  });
  adapter.start();
});
