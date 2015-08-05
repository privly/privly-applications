/**
 * @fileOverview This is the controller part for the
 * `seamless` use-case of the Message App. To learn more
 * about the MVC architecture of a Privly Application,
 * see Message/js/messageApp.js and Message/js/new.js.
 */
/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.model.Plainpost();
  var adapter = new Privly.app.viewAdapter.Seamless(app);
  adapter.start();
});
