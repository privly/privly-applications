/**
 * @fileOverview This script is responsible for integrating privly-applications,
 * content scripts, the browser extension background script,
 * and mobile architectures with message passing. Each of these scripting contexts
 * include this script on each of the platforms (Chrome, Firefox, etc).
 * When you want to receive a message, you should register the listener with
 * `Privly.message.addListener` and when you want to send a message to a
 * particular context you should use `Privly.message.messagePrivlyApplications`,
 * `Privly.message.messageContentScripts`, and `Privly.message.messageExtension`.
 *
 * Currently this context messenger can only work in Chrome.
 * Android platform detection and messaging functionality has been added, however
 * Android client side code has not yet been modified to adapt the new protocol.
 * So it doesn't work in Android for the time being.
 *
 * If you want to make this library adapt to a new platform:
 *
 *    You need to write a class, which is called a platform adapter.
 *    Your class should inherit BaseAdapter (Privly.message.adapter.Base)
 *    and provides isPlatformMatched() and getInstance() static method.
 *
 *    You also need to implement the following interface:
 *    - getPlatformName()
 *        Returns the platform name
 *
 *    - getContextName()
 *        Must return one of the three values:
 *        BACKGROUND_SCRIPT, PRIVLY_APPLICATION, CONTENT_SCRIPT
 *
 *        You should always adapt the name to three of these by
 *        their roles, even when the name cannot correctly
 *        represent the functionality.
 *
 *    - sendMessageTo(to, data)
 *        The `to` parameter is one of three values:
 *        BACKGROUND_SCRIPT, PRIVLY_APPLICATION, CONTENT_SCRIPT
 *
 *        You need to correctly handle send message requests based on
 *        the `to` parameter.
 *
 *        The `data` parameter is always an object and is always
 *        JSON serializable. You need to serialize it if your platform
 *        message pathway doesn't support passing an object directly.
 *
 *    - setListener(callback)
 *        Write platform specific code to listen incoming messages if
 *        there are. You should call callback(data) after you receiving
 *        and unserializing incoming messages in your platform. The
 *        data parameter you passed to callback function should be
 *        an object.
 *
 *    You can check out ChromeAdapter (Privly.message.adapter.Chrome)
 *    to see the sample implementation.
 *
 *
 * If you want to use this library to send and receive message:
 *
 *    Send message to the background script (or the extension on Android platform):
 *
 *        Privly.message.messageExtension(data)
 *
 *    Send message to all content scripts:
 *
 *        Privly.message.messageContentScripts(data)
 *
 *    Send message to all Privly application page:
 *
 *        Privly.message.messagePrivlyApplications(data)
 *
 *    You can use any data type in the data parameter. The underlayer
 *    compatibility adapters can transparently serialize and unserialize it for you
 *    when sending messages and receiving messages using our interface.
 *
 *    All of the three functions return Promise objects. You can retrive the response
 *    data (or null) if the Promise is resolved.
 *
 *    Sample usage:
 *
 *        Privly.message.messageExtension(data).then(function () {
 *          console.log('message sent!');
 *        });
 *
 *        Privly.message.messageExtension(data).then(function (response) {
 *          console.log('response from the message receiver: ', response);
 *        });
 *    
 *    
 *    
 *    Receive messages sent to the current context:
 *
 *        Privly.message.addListener(callback)
 *
 *    Your callback function will be called when there is an incoming message which is
 *    sent to the current context.
 *
 *    The signature of your callback function is: function(data, sendResponse)
 *
 *    The `data` parameter is the data of the message.
 *    The `sendResponse` parameter is a callable function. You could use sendResponse(data)
 *    to send response back to the sender. This function becomes invalid when the message
 *    listener returns, unless you return true from the message listener to indicate you wish
 *    to send a response asynchronously (this will keep the message channel open to the other
 *    end until sendResponse is called)
 * 
 * 
 * 
 *    Remove a message listener:
 *
 *        Privly.message.removeListener(fn)
 * 
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

  Privly.message.adapter.Base = BaseAdapter;




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
          chrome.tabs.sendMessage(tab.id, payload);
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
    return (typeof safari !== 'undefined' && typeof safari.extension !== 'undefined');
  };

  /** @inheritdoc */
  SafariAdapter.getInstance = function () {
    return new SafariAdapter();
  };

  /** @inheritdoc */
  SafariAdapter.prototype.getPlatformName = function () {
    return 'SAFARI';
  };

  /** @inheritdoc */
  SafariAdapter.prototype.getContextName = function () {
    if (window.document.getElementById('is-background-script') !== null) {
      return 'BACKGROUND_SCRIPT';
    } else if (window.location.href.indexOf(window.location.origin + '/privly-applications') === 0) {
      return 'PRIVLY_APPLICATION';
    } else {
      return 'CONTENT_SCRIPT';
    }
  };

  /** @inheritdoc */
  SafariAdapter.prototype.sendMessageTo = function (to, payload) {
    if (to === 'BACKGROUND_SCRIPT') {
      safari.self.tab.dispatchMessage(payload);
      return;
    }
    if (to === 'CONTENT_SCRIPT') {
      // Send message to all content scripts
      safari.application.activeBrowserWindow.tabs.forEach(function (tab) {
        // Don't message Privly Applications
        if (tab.url.indexOf('safari-extension') !== 0) {
          tab.page.dispatchMessage(payload);
        }
      });
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      // Send message to all content scripts
      safari.application.activeBrowserWindow.tabs.forEach(function (tab) {
        tab.page.dispatchMessage(payload);
      });
      return;
    }
  };

  /** @inheritdoc */
  SafariAdapter.prototype.setListener = function (callback) {
    if (this.getContextName() === 'BACKGROUND_SCRIPT') {
      safari.application.addEventListener("message", function(payload) {
        callback(payload);
      }, true);
    }
    if (this.getContextName() === 'CONTENT_SCRIPT') {
      safari.self.addEventListener("message", function(payload) {
        callback(payload);
      }, true);
    }
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
    var adapters = [IOSAdapter, AndroidAdapter, ChromeAdapter, FirefoxAdapter, SafariAdapter];
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
   * Store every response promise resolve function here.
   * The key is the unique message id.
   * 
   * @type {Object}
   */
  Privly.message._responsePromiseResolvers = {};

  /**
   * Send message to a context. It is not recommended to use
   * this function. You can use wrapper functions instead:
   * `messageExtension`, `messageContentScripts`,
   * `messagePrivlyApplications`.
   * 
   * @param  {String} to available options:
   * 'CONTENT_SCRIPT', 'BACKGROUND_SCRIPT', 'PRIVLY_APPLICATION'
   * @param  {Any} data
   *
   * @return {Promise<response>}
   */
  Privly.message.sendMessageTo = function (to, data) {
    // generate a unique id for this message
    var msgId = Privly.message.contextId + '.' + (++Privly.message._messageIdCounter).toString(16) + '.' + Date.now().toString(16);

    Privly.message.currentAdapter.sendMessageTo(to, {
      body: data,
      type: 'MESSAGE',
      from: Privly.message.currentAdapter.getContextName(),
      to: to,
      id: msgId
    });

    return new Promise(function (resolve) {
      Privly.message._responsePromiseResolvers[msgId] = resolve;
    });
  };

  /**
   * Send data to the extension or mobile device. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {Any} data The value of the message being sent to the extension.
   *
   * @return {Promise<response>}
   *
   */
  Privly.message.messageExtension = function (data) {
    return Privly.message.sendMessageTo('BACKGROUND_SCRIPT', data);
  };

  /**
   * Send data to all the content scripts. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {Any} data The value of the message being sent to the content script.
   *
   * @return {Promise<response>}
   */
  Privly.message.messageContentScripts = function (data) {
    return Privly.message.sendMessageTo('CONTENT_SCRIPT', data);
  };

  /**
   * Message all Privly Applications that are not injected into an iframe.
   * 
   * @param {Any} data the data to message to all the Privly Applications.
   *
   * @return {Promise<response>}
   */
  Privly.message.messagePrivlyApplications = function (data) {
    return Privly.message.sendMessageTo('PRIVLY_APPLICATION', data);
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

    // we may receive messages that are not intended to
    // send to this context. In such case, we should ignore
    // them.
    if (payload.to !== Privly.message.currentAdapter.getContextName()) {
      return;
    }

    // receives a message
    if (payload.type === 'MESSAGE') {

      // we only allow sending one response if there are
      // multiple listeners want to send response.
      var responseSent = false;

      var sendResponse = function (data) {
        if (responseSent) {
          return;
        }
        Privly.message.currentAdapter.sendMessageTo(payload.from, {
          to: payload.from,
          body: data,
          type: 'RESPONSE',
          id: payload.id
        });
        responseSent = true;
      };

      // whether the response channel should be preserved
      // if sendResponse is not called after all listener
      // callbacks return
      var preserveChannel = false;
      for (i = 0; i < Privly.message.listeners.length; i++) {
        fn = Privly.message.listeners[i];
        if (fn(payload.body, sendResponse) === true) {
          preserveChannel = true;
        }
      }

      // if no response is sent and no further response
      // will be sent, we still send a response message
      // to close the channel
      if (!responseSent && !preserveChannel) {
        sendResponse(null);
      }
      return;
    }

    // received a response message
    if (payload.type === 'RESPONSE') {
      if (Privly.message._responsePromiseResolvers.hasOwnProperty(payload.id)) {
        Privly.message._responsePromiseResolvers[payload.id](payload.body);
        // remove the response promise
        delete Privly.message._responsePromiseResolvers[payload.id];
      }
      return;
    }
  });

  // Setup a built-in ping-pong listener, mainly for testing and debuging purpose.
  // Any ping message send to this context will receive a pong response.
  // 
  // Ping:
  // {
  //    action: 'ping' / 'pingAsync',
  //    data: any magic data
  // }
  // 
  // Should receive response:
  // {
  //    action: 'pong',
  //    timestamp: timestamp that receive message,
  //    platform: self platform name,
  //    context: self context name,
  //    location: window location,
  //    data: the same as magic data in ping
  // }
  // 
  // for `pingAsync`, response will be sent asynchronously.
  // 
  try {
    Privly.message.addListener(function (message, sendResponse) {
      if (message !== null && typeof message === 'object' && (message.action === 'ping' || message.action === 'pingAsync')) {
        var responseBody = {
          action: message.action === 'ping' ? 'pong' : 'pongAsync',
          timestamp: Date.now(),
          platform: Privly.message.currentAdapter.getPlatformName(),
          context: Privly.message.currentAdapter.getContextName(),
          location: location.href,
          data: message.data
        };
        if (message.action === 'ping') {
          sendResponse(responseBody);
        } else if (message.action === 'pingAsync') {
          setTimeout(function () {
            sendResponse(responseBody);
          }, 1);
          return true; // keep response channel open since we will send an async response
        }
      }
    });
  } catch (ignore) {
  }

}());
