/**
 * @fileOverview Gives testing code for the local_storage.js shared library.
 *
 * This spec is managed by the Jasmine testing library.
 **/
describe ("Local Storage Test Suite", function() {

  var scriptSource = "expect-404.js";
  var cssSource = "expect-404.css";

  // Create the expected DOM
  beforeEach(function() {
    var metas = [
      {label: "PrivlyTopJS", file: "top-" + scriptSource},
      {label: "PrivlyTopCSS", file: "top-" + cssSource},
      {label: "PrivlyInjectedCSS", file: "injected-" + cssSource},
      {label: "PrivlyInjectedJS", file: "injected-" + scriptSource}
    ];
    metas.forEach(function(n){
      var newElement = $('<meta/>', {
        name: n.label,
        content: n.file
      });
      $(document.head).append(newElement);
    });
  });

  afterEach(function() {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("adds top css and js", function() {
    loadTopCSS();
    loadTopJS();
    expect($("script").length).toBe(1);
    expect($("script")[0].src).toBe(document.location.origin + "/top-" + scriptSource);
    expect($("link").length).toBe(1);
    expect($("link")[0].href).toBe(document.location.origin + "/top-" + cssSource);
  });

  it("adds injected css and js", function() {
    loadInjectedCSS();
    loadInjectedJS();
    expect($("script").length).toBe(1);
    expect($("script")[0].src).toBe(document.location.origin + "/injected-" + scriptSource);
    expect($("link").length).toBe(1);
    expect($("link")[0].href).toBe(document.location.origin + "/injected-" + cssSource);
  });

});
