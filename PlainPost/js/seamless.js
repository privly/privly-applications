/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Plainpost();
  var adapter = new Privly.adapter.SeamlessPosting(app);
  adapter.start();
});
