/**
 * @fileOverview This is the controller part for the
 * `seamless-ttl` use-case of the Message App. To learn
 * more about the MVC architecture of a Privly Application,
 * see Message/js/messageApp.js and Message/js/new.js.
 *
 * For a TTL select view controller, generally no extra
 * actions are required. Simply connects the application
 * model and the view adapter is OK.
 */
/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.model.Plainpost();
  var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(app);
  adapter.start();
});
