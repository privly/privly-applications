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
 *        Privly.message.messageExtension(data, hasResponse)
 *
 *    Send message to all content scripts:
 *
 *        Privly.message.messageContentScripts(data, hasResponse)
 *
 *    Send message to all Privly application page:
 *
 *        Privly.message.messagePrivlyApplications(data, hasResponse)
 *
 *    You can use any data type in the data parameter. The underlayer
 *    compatibility adapters can transparently serialize and unserialize it for you
 *    when sending messages and receiving messages using our interface.
 *
 *    All of the three functions return Promise objects. You can retrive the response
 *    data (or null) if the Promise is resolved.
 *
 *    If you expect to receive a response, pass hasResponse = true, otherwise you
 *    will only got a resolved Promise with `null` data.
 *
 *    Sample usage:
 *
 *        Privly.message.messageExtension(data).then(function () {
 *          console.log('message sent!');
 *        });
 *
 *        Privly.message.messageExtension(data, true).then(function (response) {
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
 *    The signature of your callback function is: function(data, sendResponse, sender)
 *
 *    The `data` parameter is the data of the message.
 *    The `sendResponse` parameter is a callable function. You could use sendResponse(data)
 *    to send response back to the sender.
 *    The `sender` parameter is currently a platform related variable. In Chrome, it is
 *    the object that sends the message.
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

  // CommonJS Module
  if (typeof module !== "undefined" && module.exports) {
    module.exports.message = Privly.message;
  }

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
    console.warn('getPlatformName is called but is not implemented');
    return 'BaseAdapter';
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
    console.warn('getContextName is called but is not implemented (current adapter: %s)', this.getPlatformName());
    return 'PRIVLY_APPLICATION';
  };

  /**
   * Underlayer function to send message to a desired context.
   * 
   * @param  {String} to Destination, available options:
   * 'CONTENT_SCRIPT', 'BACKGROUND_SCRIPT', 'PRIVLY_APPLICATION'
   * @param  {Object} payload
   */
  BaseAdapter.prototype.sendMessageTo = function (to, payload) {
    console.warn('sendMessageTo is called but is not implemented (current adapter: %s)', this.getPlatformName());
  };

  /**
   * Underlayer function to receive message
   * 
   * @param {Function<payload>} callback
   */
  BaseAdapter.prototype.setListener = function (callback) {
    console.warn('setListener is called but is not implemented (current adapter: %s)', this.getPlatformName());
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
    } else if (window.location.href.indexOf('chrome-extension://' + window.location.host + '/privly-applications/') === 0) {
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
          if (tab.url.indexOf('chrome') === -1) {
            chrome.tabs.sendMessage(tab.id, payload);
          }
        });
      });
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      // Send message to all privly applications
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          // Privly applications may stay inside iframes, so we just send message
          // to tabs. Those messages will be received by content scripts as well,
          // but it doesn't matter. The top layer would filter messages.
          chrome.tabs.sendMessage(tab.id, payload);
        });
      });
      return;
    }
  };

  /** @inheritdoc */
  ChromeAdapter.prototype.setListener = function (callback) {
    chrome.runtime.onMessage.addListener(function (payload, sender) {
      // for Chrome, we needn't check origin since it is always from a trust origin
      callback(payload, sender);
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

    var validContext = ["BACKGROUND_SCRIPT", "CONTENT_SCRIPT",
                        "PRIVLY_APPLICATION"]
    if (validContext.indexOf(FirefoxAdapter.prototype.getContextName()) !== -1) {
      return true;
    }
    // unknown context, possibly not in Firefox.
    return false;
  };

  /** @inheritdoc */
  FirefoxAdapter.getInstance = function () {
    return new FirefoxAdapter();
  };

  /** @inheritdoc 
   *
   * "Workers" here refer to the dynamically created Jetpack messaging API objects, 
   * which could be workers(Content Script instances) created by page-mod, or a panel object. 
   * All these objects provide the interface to send and receive messages using "port".
   * These objects, when created, should be added to the workers list/array using 
   * Privly.message.currentAdapter.addWorker(<worker object>).
   *
   * Stores all the dynamically created workers Or messaging API objects.
   */
  FirefoxAdapter.prototype.workers = [];

  /** @inheritdoc
   * Adds a worker to the list of workers and listens for messages.
   *
   * @param {Object} worker Jetpack messaging API object.
   */
  FirefoxAdapter.prototype.addWorker = function(worker) {
   
    var pushWorker = this.pushWorker.bind(this);
    var popWorker = this.popWorker.bind(this);
    var callback = this.listener;
    
    // Add worker to array of workers
    pushWorker(worker);
    // Listen for messages.
    worker.port.on("PRIVLY_MESSAGE", callback);
    // the workers array should contain only active workers.
    // remove the workers, that are inactive or destroyed, from the workers array.
    worker.on("pageshow", function() { pushWorker(this); });
    worker.on("pagehide", function() { popWorker(this); });
    worker.on("detach", function() { popWorker(this); });
  };

  /**
   * Adds a worker to the list of active workers. This is called when -- 
   * A new worker is attached to a tab, i.e, "attach". Or
   * An existing worker is made active again, i.e, "pageshow".
   *
   * @return {Object} worker Jetpack messaging API object.
   */
  FirefoxAdapter.prototype.pushWorker = function(worker) {
    var workers = this.workers;
    var idx = workers.indexOf(worker);
    if (idx === -1) {
      workers.push(worker);
    }
  };

  /**
   * Removes a worker from the list of active workers. This is called when -- 
   * A tab is reloaded/closed, i.e, "detach". Or
   * A worker is made inactive, i.e, "pagehide"
   *
   * @return {Object} worker Jetpack messaging API object.
   */
  FirefoxAdapter.prototype.popWorker = function(worker) {
    var workers = this.workers;
    var idx = workers.indexOf(worker);
    if (idx !== -1) {
      workers.splice(idx, 1);
    }
  };

  /** @inheritdoc */
  FirefoxAdapter.prototype.getPlatformName = function () {
    return 'FIREFOX';
  };

  /** @inheritdoc */
  FirefoxAdapter.prototype.getContextName = function () {

    if (typeof require !== "undefined") {
      return "BACKGROUND_SCRIPT";
    }
    if (typeof self !== "undefined") {
      if (typeof self.port !== "undefined") {
        return "CONTENT_SCRIPT";
      }
    }
    if (typeof window !== "undefined") {
      if (window.location.href.indexOf("chrome://") === 0) {
        return "PRIVLY_APPLICATION";
      }
    }
    return "UNKNOWN_CONTEXT";
  };

  /** @inheritdoc */
  FirefoxAdapter.prototype.sendMessageTo = function (to, data) {
   
    var contextName = this.getContextName();
    // Messages from Privly Applications to Background Script, Content Scripts
    // Privly Applications can't send messages directly to background scripts, they do so via
    // content scripts injected in the application.
    if (contextName === "PRIVLY_APPLICATION") {
      if (to === "BACKGROUND_SCRIPT" || to === "CONTENT_SCRIPT") {
        // Override the target so that the message doesn't get dropped.
        data.to = "CONTENT_SCRIPT";
      }
      parent.postMessage(JSON.stringify(data), "*");
    } 
    // Messages from Content Script to Background Script, Privly-Applications.
    else if (contextName === "CONTENT_SCRIPT") {
      if (to === "BACKGROUND_SCRIPT") {
        self.port.emit("PRIVLY_MESSAGE", data);
      } 
      else if (to === "PRIVLY_APPLICATION") {
        window.postMessage(JSON.stringify(data), "*");
      }
      else if (to === "CONTENT_SCRIPT") {
        throw new Error("Content => Content not implemented.");
      }
    }
    // Messages from Background Script to Content Script, Privly Applications
    // Background scripts can't send messages directly to privly-applications, they do so via
    // content scripts injected in the applications. 
    else if (contextName === "BACKGROUND_SCRIPT") {
      if (to === "CONTENT_SCRIPT" || to === "PRIVLY_APPLICATION") {
        // Override the target so that the message doesn't get dropped.
        data.to = "CONTENT_SCRIPT";
        // Send the message using available workers.
        var len = this.workers.length;
        for(var i=0 ; i<len ; i++) {
          this.workers[i].port.emit("PRIVLY_MESSAGE", data);
        }
      }
    }
  };

  /** @inheritdoc */
  FirefoxAdapter.prototype.setListener = function (callback) {
    var contextName = this.getContextName();
    if (contextName === "CONTENT_SCRIPT" || contextName === "PRIVLY_APPLICATION") {
      // Listen for messages sent via postMessage.
      window.addEventListener("message", function(message) {
        var success = true;
        try {
          var data = JSON.parse(message.data);
        } catch(e) {
          success = false;
        }
        if (success) {
          callback(data);
        }
      }, false, true);
    }
    if (contextName === "CONTENT_SCRIPT") {
      if (typeof self.port !== "undefined") {
        self.port.on("PRIVLY_MESSAGE", callback);
      }
    }
    this.listener = callback;
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
    } else if (window.location.href.indexOf('safari-extension://') === 0) {
      return 'PRIVLY_APPLICATION';
    } else {
      return 'CONTENT_SCRIPT';
    }
  };

  /** @inheritdoc */
  SafariAdapter.prototype.sendMessageTo = function (to, payload) {
    if (to === 'BACKGROUND_SCRIPT') {
      if (this.getContextName() === 'BACKGROUND_SCRIPT') {
        safari.self.contentWindow.postMessage(payload, '*');
      }
      else {
        safari.self.tab.dispatchMessage("privlyMessage", payload);
      }
      return;
    }
    if (to === 'CONTENT_SCRIPT') {
      if (this.getContextName() === 'PRIVLY_APPLICATION') {
        // Send message to the parent content script
        window.parent.postMessage(payload, '*');
      } else {
        // Send message to all content scripts
        safari.application.activeBrowserWindow.tabs.forEach(function (tab) {
          // Don't message Privly Applications
          if (tab.url.indexOf('safari-extension') !== 0) {
            tab.page.dispatchMessage("privlyMessage", payload);
          }
        });
      }
      return;
    }
    if (to === 'PRIVLY_APPLICATION') {
      // Send message to all content scripts
      safari.application.activeBrowserWindow.tabs.forEach(function (tab) {
        tab.page.dispatchMessage("privlyMessage", payload);
      });
      return;
    }
  };

  /** @inheritdoc */
  SafariAdapter.prototype.setListener = function (callback) {
    if (this.getContextName() === 'BACKGROUND_SCRIPT') {
      safari.application.addEventListener("message", function(payload) {
        if (typeof payload.name !== "undefined" && payload.name === "privlyMessage") {
          // The message is received from other than BACKGROUND_SCRIPT
          callback(payload.message);
        } else {
          // The message is received from BACKGROUND_SCRIPT
          callback(payload);
        }
      }, true);
    }
    if (this.getContextName() === 'CONTENT_SCRIPT') {
      safari.self.addEventListener("message", function(payload) {
        if (typeof payload.name !== "undefined" && payload.name === "privlyMessage") {
          // The message is received from other than PRIVLY_APPLICATION
          callback(payload.message);
        } else {
          // The message is received from PRIVLY_APPLICATION
          callback(payload);
        }
      }, true);
    }
    if (this.getContextName() === 'PRIVLY_APPLICATION') {
      safari.self.addEventListener("message", function(payload) {
        if (typeof payload.name !== "undefined" && payload.name === "privlyMessage") {
          // The message is received from BACKGROUND_SCRIPT
          callback(payload.message);
        } else {
          callback(payload);
        }
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
    if (typeof navigator !== "undefined") {
      return (
        (navigator.userAgent.indexOf('iPhone') >= 0 || navigator.userAgent.indexOf('iPad') >= 0)
        && navigator.userAgent.indexOf('Safari') === -1
      );
    }
    return false;
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

  /** @inheritdoc */
  HostedAdapter.prototype.setListener = function () {
    return;
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
   * @param  {Boolean} is this message expected to receive a response?
   *
   * @return {Promise<response>}
   */
  Privly.message.sendMessageTo = function (to, data, hasResponse) {
    // generate a unique id for this message
    var msgId = Privly.message.contextId + '.' + (++Privly.message._messageIdCounter).toString(16) + '.' + Date.now().toString(16);

    Privly.message.currentAdapter.sendMessageTo(to, {
      body: data,
      type: 'MESSAGE',
      from: Privly.message.currentAdapter.getContextName(),
      to: to,
      id: msgId
    });

    if (hasResponse !== true) {
      return Promise.resolve();
    } else {
      return new Promise(function (resolve) {
        Privly.message._responsePromiseResolvers[msgId] = resolve;
      });
    }
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
  Privly.message.messageExtension = function (data, hasResponse) {
    return Privly.message.sendMessageTo('BACKGROUND_SCRIPT', data, hasResponse);
  };

  /**
   * Send data to all the content scripts. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {Any} data The value of the message being sent to the content script.
   *
   * @return {Promise<response>}
   */
  Privly.message.messageContentScripts = function (data, hasResponse) {
    return Privly.message.sendMessageTo('CONTENT_SCRIPT', data, hasResponse);
  };

  /**
   * Message all Privly Applications that are not injected into an iframe.
   * 
   * @param {Any} data the data to message to all the Privly Applications.
   *
   * @return {Promise<response>}
   */
  Privly.message.messagePrivlyApplications = function (data, hasResponse) {
    return Privly.message.sendMessageTo('PRIVLY_APPLICATION', data, hasResponse);
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
  Privly.message.currentAdapter.setListener(function (payload, sender) {
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

      for (i = 0; i < Privly.message.listeners.length; i++) {
        fn = Privly.message.listeners[i];
        fn(payload.body, sendResponse, sender);
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
        var platform = Privly.message.currentAdapter.getPlatformName();
        // Only for Firefox
        // Don't respond if the message is intended for the extension background scripts.
        // Messages sent to the background scripts are received by the content scripts.
        if (platform !== "FIREFOX" || message.name !== "messageExtension") {
          var responseBody = {
            action: message.action === 'ping' ? 'pong' : 'pongAsync',
            timestamp: Date.now(),
            platform: platform,
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
          }
        }
      }
    });
  } catch (ignore) {
  }

}());
