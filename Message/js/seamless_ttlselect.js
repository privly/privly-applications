/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Message();
  var adapter = new Privly.adapter.SeamlessPostingTTLSelect(app);
  adapter.start();
});
