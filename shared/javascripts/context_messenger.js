/**
 * @fileOverview This script is responsible for integrating privly-applications,
 * content scripts, the browser extension background script,
 * and mobile architectures with message passing. Each of these scripting contexts
 * include this script on each of the platforms (Chrome, Firefox, etc).
 * When you want to receive a message, you should register the listener with
 * `Privly.message.addListener` and when you want to send a message to a
 * particular context you should use `Privly.message.messageTopPrivlyApplications`,
 * `Privly.message.messageContentScripts`, and `Privly.message.messageExtension`.
 **/

/*global chrome */
/*global Privly:true, window, navigator, androidJsBridge */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}

(function () {

  // If this file is already loaded, don't do it again
  if (Privly.message !== undefined) {
    return;
  }
  Privly.message = {};
  Privly.message.adapter = {};

  /**
   * A unique id for this context.
   * It will be used to identify the response.
   * 
   * @type {String}
   */
  Privly.message.contextId = Date.now().toString(16) + '.' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

  /**
   * The base platform adapter, used for inheritance.
   * It will always throw not implemented error, 
   * therefore those functions in derived class
   * will throw not implemented error as well if
   * it is not overridden.
   */
  var BaseAdapter = function () {};

  /**
   * Implementations should returns true if the
   * platform adapter is suitable for the current
   * platform.
   * 
   * @return {Boolean}
   */
  BaseAdapter.isPlatformMatched = function () {
    return false;
  };

  /**
   * Factory method to create a new instance for
   * the adapter.
   * 
   * @return {BaseAdapter}
   */
  BaseAdapter.getInstance = function () {
    return new BaseAdapter();
  };

  /**
   * Get the platform name
   * @return {String}
   */
  BaseAdapter.prototype.getPlatformName = function () {
    throw new Error('Not implemented');
  };

  /**
   * Get the scripting context the script is running within.
   *
   * @return {String} the name of the scripting context. Options include:
   * 'CONTENT_SCRIPT': A script added to every host page.
   * 'BACKGROUND_SCRIPT': The browser extension's script.
   * 'PRIVLY_APPLICATION': The privly application
   */
  BaseAdapter.prototype.getContextName = function () {
    throw new Error('Not implemented');
  };

  /**
   * Underlayer function to send message to a desired context.
   * 
   * @param  {String} to Destination, available options:
   * 'CONTENT_SCRIPT', 'BACKGROUND_SCRIPT', 'PRIVLY_APPLICATION'
   * @param  {Object} payload
   */
  BaseAdapter.prototype.sendMessageTo = function (to, payload) {
    console.warn('not implemented');
  };

  /**
   * Underlayer function to receive message
   * 
   * @param {Function<payload>} callback
   */
  BaseAdapter.prototype.setListener = function (callback) {
    console.warn('not implemented');
  };

  Privly.message.adapter.BaseAdapter = BaseAdapter;




  /**
   * The adapter for Chrome
   * 
   * @augments BaseAdapter
   */
  var ChromeAdapter = function () {};
  ChromeAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  ChromeAdapter.isPlatformMatched = function () {
    return (typeof chrome !== 'undefined' && typeof chrome.extension !== 'undefined');
  };

  /** @inheritdoc */
  ChromeAdapter.getInstance = function () {
    return new ChromeAdapter();
  };

  /** @inheritdoc */
  ChromeAdapter.prototype.getPlatformName = function () {
    return 'CHROME';
  };

  /** @inheritdoc */
  ChromeAdapter.prototype.getContextName = function () {
    if (window.document.getElementById('is-background-script') !== null) {
      return 'BACKGROUND_SCRIPT';
    } else if (window.location.href.indexOf(window.location.origin + '/privly-applications') === 0) {
      return 'PRIVLY_APPLICATION';
    } else {
      return 'CONTENT_SCRIPT';
    }
  };

  /** @inheritdoc */
  ChromeAdapter.prototype.sendMessageTo = function (to, payload) {
    if (to === 'BACKGROUND_SCRIPT') {
      chrome.extension.sendMessage(payload);
      return;
    }
    if (to === 'CONTENT_SCRIPT') {
      // Send message to all content scripts
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          // Don't message Privly Applications
          if (tab.url.indexOf('chrome') !== 0) {
            chrome.tabs.sendMessage(tab.id, payload);
          }
        });
      });
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      // Send message to all content scripts
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          // Only send the message to privly applications.
          // Extension cannot inject content script into
          // another extension, so if the tab can handle
          // our message, it must be the Privly application.
          if (tab.url.indexOf('chrome-extension://') === 0) {
            chrome.tabs.sendMessage(tab.id, payload);
          }
        });
      });
      return;
    }
  };

  /** @inheritdoc */
  ChromeAdapter.prototype.setListener = function (callback) {
    chrome.runtime.onMessage.addListener(function (payload) {
      // for Chrome, we needn't check origin since it is always from a trust origin
      callback(payload);
    });
  };

  Privly.message.adapter.Chrome = ChromeAdapter;




  /**
   * The adapter for Firefox
   *
   * @augments BaseAdapter
   */
  var FirefoxAdapter = function () {};
  FirefoxAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  FirefoxAdapter.isPlatformMatched = function () {
    return (typeof chrome === 'undefined' && window.location.href.indexOf('chrome://') === 0);
  };

  /** @inheritdoc */
  FirefoxAdapter.getInstance = function () {
    return new FirefoxAdapter();
  };

  /** @inheritdoc */
  FirefoxAdapter.prototype.getPlatformName = function () {
    return 'FIREFOX';
  };
  Privly.message.adapter.Firefox = FirefoxAdapter;




  /**
   * The adapter for Safari
   *
   * @augments BaseAdapter
   */
  var SafariAdapter = function () {};
  SafariAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  SafariAdapter.isPlatformMatched = function () {
    console.warn('not implemented');
    return false;
  };

  /** @inheritdoc */
  SafariAdapter.getInstance = function () {
    return new SafariAdapter();
  };

  /** @inheritdoc */
  SafariAdapter.prototype.getPlatformName = function () {
    return 'SAFARI';
  };
  Privly.message.adapter.Safari = SafariAdapter;




  /**
   * The adapter for iOS
   *
   * @augments BaseAdapter
   */
  var IOSAdapter = function () {};
  IOSAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  IOSAdapter.isPlatformMatched = function () {
    return (
      (navigator.userAgent.indexOf('iPhone') >= 0 || navigator.userAgent.indexOf('iPad') >= 0)
      && navigator.userAgent.indexOf('Safari') === -1
    );
  };

  /** @inheritdoc */
  IOSAdapter.getInstance = function () {
    return new IOSAdapter();
  };

  /** @inheritdoc */
  IOSAdapter.prototype.getPlatformName = function () {
    return 'IOS';
  };

  /** @inheritdoc */
  IOSAdapter.prototype.getContextName = function () {
    return 'PRIVLY_APPLICATION';
  };

  /** @inheritdoc */
  IOSAdapter.prototype.sendMessageTo = function (to, data) {
    if (to === 'BACKGROUND_SCRIPT') {
      // TODO: the data here encapsuled some other infomation
      // iOS client side should handle this
      var iOSurl = 'js-frame:' + JSON.stringify(data);
      var iframe = document.createElement('IFRAME');
      iframe.setAttribute('src', iOSurl);
      iframe.setAttribute('height', '1px');
      iframe.setAttribute('width', '1px');
      document.documentElement.appendChild(iframe);
      iframe.parentNode.removeChild(iframe);
      iframe = null;
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      throw new Error('Not implemented');
      return;
    }
  };
  Privly.message.adapter.IOS = IOSAdapter;




  /**
   * The adapter for Android
   *
   * @augments BaseAdapter
   */
  var AndroidAdapter = function () {};
  AndroidAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  AndroidAdapter.isPlatformMatched = function () {
    return (typeof androidJsBridge !== 'undefined');
  };

  /** @inheritdoc */
  AndroidAdapter.getInstance = function () {
    return new AndroidAdapter();
  };

  /** @inheritdoc */
  AndroidAdapter.prototype.getPlatformName = function () {
    return 'ANDROID';
  };

  /** @inheritdoc */
  AndroidAdapter.prototype.getContextName = function () {
    return 'PRIVLY_APPLICATION';
  };

  /** @inheritdoc */
  AndroidAdapter.prototype.sendMessageTo = function (to, data) {
    if (to === 'BACKGROUND_SCRIPT') {
      // TODO: the data here encapsuled some other infomation
      // Android client side should handle this
      androidJsBridge.receiveNewPrivlyURL(data);
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      throw new Error('Not implemented');
      return;
    }
  };
  Privly.message.adapter.Android = AndroidAdapter;




  /**
   * The adapter for hosted environment
   *
   * @augments BaseAdapter
   */
  var HostedAdapter = function () {};
  HostedAdapter.prototype = Object.create(BaseAdapter.prototype);

  /** @inheritdoc */
  HostedAdapter.isPlatformMatched = function () {
    return true;
  };

  /** @inheritdoc */
  HostedAdapter.getInstance = function () {
    return new HostedAdapter();
  };

  /** @inheritdoc */
  HostedAdapter.prototype.getPlatformName = function () {
    return 'HOSTED';
  };

  /** @inheritdoc */
  HostedAdapter.prototype.getContextName = function () {
    return 'PRIVLY_APPLICATION';
  };

  /** @inheritdoc */
  HostedAdapter.prototype.sendMessageTo = function (to, data) {
    if (to === 'BACKGROUND_SCRIPT') {
      // Don't send these messages in the hosted environment since the
      // extension is not there.
      return;
    }
    if (to === 'CONTENT_SCRIPT') {
      // Don't send these messages in the hosted environment since the
      // content scripts are not there.
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      throw new Error('Not implemented');
      return;
    }
  };
  Privly.message.adapter.Hosted = HostedAdapter;




  /**
   * Determines which platform the script is runing on. This helps determine
   * which request function should be used. The current values are 'CHROME'
   * for the Google Chrome extension, and 'HOSTED' for all other architectures.
   * HOSTED functions use standard same-origin AJAX requests.
   *
   * @return {Adapter}
   */
  function getPlatformAdapter() {
    // Hosted adapter should be always placed at the last position because it
    // is a fallback.
    var adapters = [IOSAdapter, AndroidAdapter, ChromeAdapter, FirefoxAdapter];
    var i;
    for (i = 0; i < adapters.length; ++i) {
      if (adapters[i].isPlatformMatched()) {
        return adapters[i];
      }
    }
    return HostedAdapter;
  }

  /**
   * Reference the appropriate platform adapter.
   */
  Privly.message.currentAdapter = getPlatformAdapter().getInstance();

  /**
   * A counter for uniquely mark every message in this context.
   * It is auto increment counter. We also need contextId to uniquely
   * mark the message across contexts.
   * 
   * @type {Number}
   */
  Privly.message._messageIdCounter = 0;

  /**
   * Store every response callbacks here.
   * The key is the unique message id.
   * 
   * @type {Object}
   */
  Privly.message._responseCallbacks = {};

  /**
   * Send message to a context.
   * @param  {String} to
   * @param  {Any} data
   * @param  {Function<data>} responseCallback
   */
  Privly.message.sendMessageTo = function (to, data, responseCallback) {
    // generate a unique id for this message
    var msgId = Privly.message.contextId + '.' + (++Privly.message._messageIdCounter).toString(16) + '.' + Date.now().toString(16);

    Privly.message.currentAdapter.sendMessageTo(to, {
      body: data,
      type: 'MESSAGE',
      from: Privly.message.currentAdapter.getContextName(),
      id: msgId
    });

    if (typeof responseCallback === 'function') {
      Privly.message._responseCallbacks[msgId] = responseCallback;
    }
  };

  /**
   * Send data to the extension or mobile device. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {Any} data The value of the message being sent to the extension.
   *
   */
  Privly.message.messageExtension = function (data, responseCallback) {
    Privly.message.sendMessageTo('BACKGROUND_SCRIPT', data, responseCallback);
  };

  /**
   * Send data to all the content scripts. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {Any} data The value of the message being sent to the content script.
   */
  Privly.message.messageContentScripts = function (data, responseCallback) {
    Privly.message.sendMessageTo('CONTENT_SCRIPT', data, responseCallback);
  };

  /**
   * Message all Privly Applications that are not injected into an iframe.
   * 
   * @param {Any} data the data to message to all the Privly Applications.
   */
  Privly.message.messageTopPrivlyApplications = function (data, responseCallback) {
    Privly.message.sendMessageTo('PRIVLY_APPLICATION', data, responseCallback);
  };

  /**
   * A hash of functions that are called upon receipt of a message.
   * Every function added to this hash should check whether the message was intended
   * to be handled by it before executing any other code. There are no guarantees of
   * execution order.
   */
  Privly.message.listeners = [];

  /**
   * Adds a listener to the message listener list.
   * 
   * @param {Function<data, sendResponse>} listener accepts an object
   * containing the message
   */
  Privly.message.addListener = function (listener) {
    if (Privly.message.listeners.indexOf(listener) === -1) {
      Privly.message.listeners.push(listener);
    }
  };

  /**
   * Remove a listener from the message listener list.
   * 
   * @param  {Function<data, sendResponse>} listener
   */
  Privly.message.removeListener = function (listener) {
    var index = Privly.message.listeners.indexOf(listener);
    if (index > -1) {
      Privly.message.listeners.splice(index, 1);
    }
  };

  // Add message listener. this message listener will
  // handle all raw messages received and forward to the
  // user specified listeners or a response callback function.
  Privly.message.currentAdapter.setListener(function (payload) {
    var fn, i;

    // receives a message
    if (payload.type === 'MESSAGE') {

      var sendResponse = function (data) {
        Privly.message.currentAdapter.sendMessageTo(payload.from, {
          body: data,
          type: 'RESPONSE',
          id: payload.id
        });
      };

      // A list of functions to remove after all the listener have completed
      var removeList = [], removeListener;
      for (i = 0; i < Privly.message.listeners.length; i++) {
        fn = Privly.message.listeners[i];
        removeListener = fn(payload.body, sendResponse);
        if (removeListener === true) {
          removeList.push(fn);
        }
      }

      // Remove all the functions that returned `true`.
      for (i = 0; i < removeList.length; i++) {
        Privly.message.removeListener(removeList[i]);
      }

      return;
    }

    // receives a response message
    if (payload.type === 'RESPONSE') {
      if (Privly.message._responseCallbacks.hasOwnProperty(payload.id)) {
        Privly.message._responseCallbacks[payload.id](payload.body);
        // remove the response callback
        delete Privly.message._responseCallbacks[payload.id];
      }
      return;
    }
  });

}());