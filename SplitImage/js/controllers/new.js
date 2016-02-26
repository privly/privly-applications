/**
 * @fileOverview This is the controller part for the
 * `new` use-case of the SplitImage App. To learn more
 * about the MVC architecture of a Privly Application,
 * see SplitImage/js/splitimageApp.js
 *
 * As a controller, it should initialize the view prototype
 * when the web page is loaded. The most important thing is,
 * it should connect the view layer and the model layer.
 * This is accomplished by simply pass our Application Model
 * Object (Privly.app.model.SplitImage) to the view adapter script.
 */
/*global Privly, markdown */
document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('files').addEventListener('change', 
    handleFileSelect, false);
  
  // Handle drag and drop
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', function(evt){
    handleFileSelect(evt);
    $("#preview_area").show();
    $("#drop_zone").hide();
  }, false);

  var app = new Privly.app.model.SplitImage();
  app.generateRandomKey();

  var adapter = new Privly.app.viewAdapter.New(app);

  adapter.on('afterPostCompleted', function (response, url) {
    app.storeUrl(url);
  });

  adapter.connectionSucceeded = function() {
    var self = this;
    document.querySelector('#save').addEventListener('click', self.save);
    self.pendingPost();
  }

  // The user submitted the form so the content will be sent to the remote server.
  // This encrypts the content with a new random key before sending it to the
  // remote server.
  adapter.save = function() {
    var self = adapter;
    return self
      .getRequestContent($("#clearimage")[0].src)
      .then(function (json) {
        self.postSubmit(
          json.structured_content,
          self.application.name,
          $("#seconds_until_burn").val(),
          json.content
        );
      });
  }

  adapter.start();
});
