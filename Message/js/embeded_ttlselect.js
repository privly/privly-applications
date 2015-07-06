/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Message();
  var embededSelectAdapter = new Privly.adapter.EmbededTTLSelect(app);
  embededSelectAdapter.start();
});