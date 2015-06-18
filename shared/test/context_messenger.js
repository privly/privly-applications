/**
 * @fileOverview context_messenger.js Gives testing spec for communicating
 * with extensions, content scripts, and privly applications.
 *
 * This spec is expressed using the Jasmine testing library.
 **/

describe ("Messaging Test Suite", function() {

  it("can send a URL to the extension", function() {
    var message = {"handler": "privlyUrl"};
    Privly.message.messageExtension(message);
  });

  it("can ask for the starting content from the extension", function() {
    var message = {"handler": "initialContent"};
    Privly.message.messageExtension(message);
  });

  it("can tell the extension about changes to the options", function() {
    var message = {
      action: "options/changed",
      option: "optionName",
      newValue: "optionValue"
    };
    Privly.message.messageExtension(message);
  });

  it("can tell the content scripts about changes to the options", function() {
    var message = {
      action: "options/changed",
      option: "optionName",
      newValue: "optionValue"
    };
    Privly.message.messageContentScripts(message);
  });

  it("trusts the extension origins", function() {

    // TODO: these detection should be placed into #Adapter.setListener

    return;

    var paths = [
      "",
      "test.com",
      "daksjflaskjfalskjfs/skjsdkdjsksdj?kjkfjsff=dwkdwwkdjw",
      "privly/privly-applications/test.html"
    ];
    for( var i = 0; i < paths.length; i++ ) {
      var testWindow = {location: {href:""}}
      testWindow.location.href = "chrome://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(true);
      testWindow.location.href = "chrome-extension://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(true);
      testWindow.location.href = "safari-extension://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(true);
    }
  });

  it("doesn't trust non-extension origins", function() {

    // TODO: these detection should be placed into #Adapter.setListener

    return;

    var paths = [
      "",
      "test.com",
      "daksjflaskjfalskjfs/skjsdkdjsksdj?kjkfjsff=dwkdwwkdjw",
      "privly/privly-applications/test.html"
    ];
    for( var i = 0; i < paths.length; i++ ) {
      var testWindow = {location: {href:""}}
      testWindow.location.href = "http://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "https://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "file://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "chromes://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "extension://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "//" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "opera://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
      testWindow.location.href = "localhost://" + paths[i];
      expect(Privly.message.isTrustedOrigin(testWindow)).toBe(false);
    }
  });

});
