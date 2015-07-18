/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Message();
  app.generateRandomKey();
  var adapter = new Privly.adapter.SeamlessPosting(app);
  adapter.on('afterCreateLink', function (url) {
    app.storeUrl(url);
  });
  adapter.on('afterDeleteLink', function (url) {
    app.removeUrl(url);
  });
  adapter.start();
});
