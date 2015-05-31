/*global Privly */
document.addEventListener('DOMContentLoaded', function () {
  var message = new Privly.app.Message();
  var embededAdapter = new Privly.adapter.Embeded(message);
  embededAdapter.on('afterCreateLink', function(url, dataUrl) {
    message.storeUrl(url);
  });
  embededAdapter.on('afterDeleteLink', function(url, dataUrl) {
    message.removeUrl(url);
  });
  embededAdapter.start();
});