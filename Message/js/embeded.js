/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var app = new Privly.app.Message();
  var embededAdapter = new Privly.adapter.Embeded(app);
  embededAdapter.on('afterCreateLink', function (url) {
    app.storeUrl(url);
  });
  embededAdapter.on('afterDeleteLink', function (url) {
    app.removeUrl(url);
  });
  embededAdapter.start();
});