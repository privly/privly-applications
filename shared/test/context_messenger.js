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

describe('Privly.message.adapter.Chrome', function () {

  it('creates instance', function () {
    var instance = Privly.message.adapter.Chrome.getInstance();
    expect(instance instanceof Privly.message.adapter.Chrome).toBe(true);
  });

  it('returns platform name', function () {
    var instance = Privly.message.adapter.Chrome.getInstance();
    expect(instance.getPlatformName()).toBe('CHROME');
  });

  it('returns context name', function () {
    var instance = Privly.message.adapter.Chrome.getInstance();

    // for backgrouns script, we have a special meta node
    var backgroundMarker = document.createElement('meta');
    backgroundMarker.id = 'is-background-script';
    document.head.appendChild(backgroundMarker);
    expect(instance.getContextName()).toBe('BACKGROUND_SCRIPT');
    document.head.removeChild(backgroundMarker);

    // for privly applications (top or embedded), the location is special.. however we could not test it here
    expect(instance.getContextName()).toBe('CONTENT_SCRIPT');
  });

  it('sends message to background scripts using chrome.extension.sendMessage', function (done) {
    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.extension) {
      window.chrome.extension = {};
    }
    var backup = window.chrome.extension.sendMessage;
    window.chrome.extension.sendMessage = function (payload) {
      expect(payload).toEqual({magic: '456'});
      // restore and done
      window.chrome.extension.sendMessage = backup;
      done();
    };

    var instance = Privly.message.adapter.Chrome.getInstance();
    instance.sendMessageTo('BACKGROUND_SCRIPT', { magic: '456' });
  });

  it('sends message to content scripts and Privly applications using chrome.tabs.sendMessage', function () {
    var messageSent = {};
    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.tabs) {
      window.chrome.tabs = {};
    }
    var queryBackup = window.chrome.tabs.query;
    window.chrome.tabs.query = function (query, callback) {
      callback([
        {
          id: 1,
          url: 'http://notexist.example.com'
        },
        {
          id: 10,
          url: 'chrome-extension://ogijphpnglhlecfcfhcbhjmphpokhcfg/privly-applications/Pages/ChromeOptions.html'
        },
        {
          id: 15,
          url: 'http://test.privly.org/test_pages/whitelist.html'
        }
      ]);
    };
    var sendMessageBackup = window.chrome.tabs.sendMessage;
    window.chrome.tabs.sendMessage = function (target, payload) {
      if (!messageSent[target]) {
        messageSent[target] = [];
      }
      messageSent[target].push(payload);
    };

    var data = { magic: '123' };
    var instance = Privly.message.adapter.Chrome.getInstance();
    instance.sendMessageTo('CONTENT_SCRIPT', data);
    expect(messageSent[1].length).toBe(1);
    expect(messageSent[1][0]).toEqual(data);
    expect(messageSent[15].length).toBe(1);
    expect(messageSent[15][0]).toEqual(data);

    // clear and test sending message to Privly application
    messageSent = {};
    instance.sendMessageTo('PRIVLY_APPLICATION', data);
    expect(messageSent[1].length).toBe(1);
    expect(messageSent[1][0]).toEqual(data);
    expect(messageSent[10].length).toBe(1);
    expect(messageSent[10][0]).toEqual(data);
    expect(messageSent[15].length).toBe(1);
    expect(messageSent[15][0]).toEqual(data);

    // sending message to other: no errors should be thrown
    try {
      instance.sendMessageTo('XXX', { magic: '456' });
    } catch(ignore) {
      // fail the test
      expect(false).toBe(true);
    }

    // restore
    window.chrome.tabs.sendMessage = sendMessageBackup;
    window.chrome.tabs.query = queryBackup;
  });

  it('sets listener using chrome.runtime.onMessage.addListener', function (done) {
    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.runtime) {
      window.chrome.runtime = {};
    }
    if (!window.chrome.runtime.onMessage) {
      window.chrome.runtime.onMessage = {};
    }
    var backup = window.chrome.runtime.onMessage.addListener;
    window.chrome.runtime.onMessage.addListener = function (callback) {
      callback({ magic: 'data' });
    };

    var instance = Privly.message.adapter.Chrome.getInstance();
    instance.setListener(function (payload) {
      expect(payload).toEqual({ magic: 'data' });
      // restore and done
      window.chrome.runtime.onMessage.addListener = backup;
      done();
    });
  });

});

