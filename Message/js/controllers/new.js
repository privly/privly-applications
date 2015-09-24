/**
 * @fileOverview This is the controller part for the
 * `new` use-case of the Message App. To learn more
 * about the MVC architecture of a Privly Application,
 * see Message/js/messageApp.js
 *
 * As a controller, it should initialize the view prototype
 * when the web page is loaded. The most important thing is,
 * it should connect the view layer and the model layer.
 * This is accomplished by simply pass our Application Model
 * Object (Privly.app.model.Message) to the view adapter script.
 *
 * In Message App, when user is creating a content, we also
 * need a preview functionality. Markdown are parsed into
 * HTML as a preview in real time. This task is also
 * completed by this controller.
 */
/*global Privly, markdown */
document.addEventListener('DOMContentLoaded', function () {
  // Don't start the script if it is running in a Headless
  // browser
  if (!document.getElementById("logout_link")) {
    return;
  }

  /**
   * Display rendered markdown as a preview of the post.
   */
  function previewMarkdown() {
    var preview = document.getElementById("preview");
    var mkdwn = document.getElementById("content").value;
    preview.innerHTML = markdown.toHTML(mkdwn);
  }

  var app = new Privly.app.model.Message();
  app.generateRandomKey();

  var adapter = new Privly.app.viewAdapter.New(app);

  adapter.on('afterPostCompleted', function (response, url) {
    app.storeUrl(url);
  });

  adapter.on('afterConnectionSucceeded', function () {
    var contentElement = document.getElementById("content");
    contentElement.addEventListener('keyup', previewMarkdown);
  });

  adapter.start();
});
