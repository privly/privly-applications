/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Plainpost();
  var embededAdapter = new Privly.adapter.Embeded(app);
  embededAdapter.start();
});