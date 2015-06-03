/**
 * @fileOverview This script is responsible for integrating privly-applications,
 * content scripts, the browser extension background script,
 * and mobile architectures with message passing. Each of these scripting contexts
 * include this script on each of the platforms (Chrome, Firefox, etc).
 * When you want to receive a message, you should register the listener with
 * `Privly.message.addListener` and when you want to send a message to a
 * particular context you should use `Privly.message.messageTopPrivlyApplications`,
 * `Privly.message.messageContentScripts`, and `Privly.message.messageExtension`.
 *
 * Please note that these messages are broadcast to all Privly content scripts and
 * non-injected Privly applications. To identify return messages several of the
 * messages define `originalRequest` as the request that was sent to the extension.
 * In the future we may add some sort of cross-platform sendResponse functionality
 * similar to that found on Chrome, but this is not currently easy.
 *
 **/

 /*global chrome */
 /*global Privly:true, ls */

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

  /**
   * Determines which platform the script is runing on. This helps determine
   * which request function should be used. The current values are "CHROME"
   * for the Google Chrome extension, and "HOSTED" for all other architectures.
   * HOSTED functions use standard same-origin AJAX requests.
   *
   * @return {string} the name of the platform.
   */
  function getPlatformName(){
    if (navigator.userAgent.indexOf("iPhone") >= 0 ||
      navigator.userAgent.indexOf("iPad") >= 0) {
      if( navigator.userAgent.indexOf("Safari") >= 0 ) { return "HOSTED"; }
        return "IOS";
    } else if(typeof androidJsBridge !== "undefined") {
      return "ANDROID";
    }  else if (typeof chrome !== "undefined" && typeof chrome.extension !== "undefined") {
      return "CHROME";
    } else if(window.location.href.indexOf("chrome://") === 0) {
      return "FIREFOX";
    } else {
      return "HOSTED";
    }
  }

  /**
   * Reference the constant platform name here.
   */
  Privly.message.currentPlatform = getPlatformName();

  /**
   * Determines which scripting context the script is running within.
   *
   * @return {string} the name of the scripting context. Options include:
   * "CONTENT_SCRIPT": A script added to every host page.
   * "BACKGROUND_SCRIPT": The browser extension's script.
   * "PRIVLY_APPLICATION": The privly application
   */
  function getPlatformContext() {
    if ( Privly.message.currentPlatform === "CHROME" ) {
      if( window.document.getElementById("is-background-script") !== null ) {
        return "BACKGROUND_SCRIPT";
      } else if(
        window.location.href.indexOf(
          window.location.origin + "/privly-applications") === 0) {
        return "PRIVLY_APPLICATION";
      } else {
        return "CONTENT_SCRIPT";
      }
    } else if( Privly.message.currentPlatform === "FIREFOX" ) {
      // jetpack todo
      console.warn("todo: This has not been implemented for Jetpack yet");
    } else if( Privly.message.currentPlatform === "SAFARI" ) {
      // safari todo
      console.warn("todo: This has not been implemented for safari yet");
    } else if( Privly.message.currentPlatform === "HOSTED" ) {
      return "PRIVLY_APPLICATION";
    } else if( Privly.message.currentPlatform === "ANDROID" ) {
      return "PRIVLY_APPLICATION";
    } else if( Privly.message.currentPlatform === "IOS" ) {
      return "PRIVLY_APPLICATION";
    }
  }

  /**
   * Reference the constant platform context name here.
   */
  Privly.message.currentContext = getPlatformContext();

  /**
   * Determines whether a function is defined.
   *
   * @param {function} fn Potentially a function.
   * @return {boolean} True if the parameter is a function, else false
   */
  function functionExists(fn) {
    if (typeof fn === "function") {
      return true;
    }
    return false;
  }

  /**
   * Send data to the extension or mobile device. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {json} message The value of the message being sent to the extension.
   *
   */
  Privly.message.messageExtension = function (message) {

    // Don't send these messages in the hosted environment since the
    // extension is not there.
    if( Privly.message.currentPlatform === "HOSTED" ) {
      return;
    }

    // Don't send these messages to the extension context from the
    // extension context.
    if( Privly.message.currentContext === "BACKGROUND_SCRIPT" ) {
      return;
    }

    // Platform specific messaging
    var platform = Privly.message.currentPlatform;
    if ( platform === "CHROME") {
      chrome.extension.sendMessage(
        message,
        Privly.message.receiveMessage);
    } else if(platform === "FIREFOX") {
      // todo, message the jetpack extension
      console.warn("todo: This has not been implemented for Jetpack yet");
    } else if(platform === "SAFARI") {
      // todo, message the Safari extension
      console.warn("todo: This has not been implemented for Safari yet");
    } else if(message.privlyUrl &&
              platform === "IOS") {
      var iOSurl = "js-frame:" + data;
      var iframe = document.createElement("IFRAME");
      iframe.setAttribute("src", iOSurl);
      iframe.setAttribute("height", "1px");
      iframe.setAttribute("width", "1px");
      document.documentElement.appendChild(iframe);
      iframe.parentNode.removeChild(iframe);
      iframe = null;
    } else if(message.privlyUrl &&
              platform === "ANDROID") {
      androidJsBridge.receiveNewPrivlyURL(data);
    }
  };

  /**
   * Send data to all the content scripts. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param {json} data The value of the message being sent to the extension.
   */
  Privly.message.messageContentScripts = function (data) {

    // Don't send these messages in the hosted environment since the
    // content scripts are not there.
    if( Privly.message.currentPlatform === "HOSTED" ) {
      return;
    }

    var platform = Privly.message.currentPlatform;
    if( platform === "CHROME" ) {

      // Send message to all content scripts
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {

          // Don't message Privly Applications
          if ( tab.url.indexOf("chrome") !== 0 ) {
            chrome.tabs.sendMessage(tab.id, data);
          }
        });
      });
    } else if( platform === "FIREFOX" ) {
      // jetpack todo
      console.warn("todo: This has not been implemented for Jetpack yet");
    } else if( platform === "SAFARI" ) {
      // safari todo
      console.warn("todo: This has not been implemented for Safari yet");
    }
  };

  /**
   * Message all Privly Applications that are not injected into an iframe.
   * @param {object} data the data to message to all the Privly Applications.
   */
  Privly.message.messageTopPrivlyApplications = function (data) {

    // Platform specific messaging
    var platform = Privly.message.currentPlatform;
    if( platform === "CHROME" ) {

      // Send message to all content scripts
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {

          // Only send the message to privly applications
          if ( tab.url.indexOf("chrome-extension://") === 0 ) {
            chrome.tabs.sendMessage(tab.id, data);
          }
        });
      });
    } else if( platform === "FIREFOX" ) {
      // todo jetpack
      console.warn("todo: this has not been implemented on Jetpack yet");
    } else if( platform === "SAFARI" ) {
      // todo Safari
      console.warn("todo: this has not been implemented on Safari yet");
    } else {
      console.warn("todo: this has not been implemented on this platform");
    }
  }

  /**
   * Checks the window object to see if it is from a trusted origin,
   * which is a URL from an extension context.
   */
  Privly.message.isTrustedOrigin = function(win) {
    var href = win.location.href;
    var trusted =  href.indexOf("chrome://") === 0 ||
      href.indexOf("chrome-extension://") === 0 ||
      href.indexOf("safari-extension://") === 0;
    return trusted;
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
    * @param {function} listener accepts an object
    * containing
    *
    */
   Privly.message.addListener = function(listener) {
     Privly.message.listeners.push(listener);
   };

  /**
   * This function handles all messages sent to the app using the postMessage
   * interface. In order to verify that the sender of the message should be
   * trusted, this function has platform-specific checks on the sender's
   * origin before dispatching it to the appropriate handler.
   *
   * @param {event} ev The message event containing:
   *    {data: JSON, source: WINDOW, response_to: OBJECT }
   *    Where the `data` is the message JSON, the `source` is the window object sending
   *    the message, and `response_to` is a copy of the message that resulted in this
   *    response. If the `response_to` object is
   */
  Privly.message.receiveMessage = function(ev) {
    if( ! Privly.message.isTrustedOrigin(ev.source) ) {
      console.warn("An untrusted message was rejected.");
      return;
    }

    // A list of functions to remove after all the listener have completed
    var removeList = [];
    for( var i = 0; i < Privly.message.listeners.length; i++ ) {
      var fn = Privly.message.listeners[i];
      if( fn(ev.data) ) {
        removeList.push(fn);
      }
    }

    // Remove all the functions that returned `true`.
    for( i = 0; i < removeList.length; i++ ) {
      var removeIndex = Privly.message.listeners.indexOf(removeList[i]);
      Privly.message.listeners.splice(removeIndex, 1);
    }
  };
}());

/**
 * Listen to messages on the platform and munge the message into a consistent format.
 */
if(Privly.message.currentPlatform === "CHROME") {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      // Manually assign the source because only trust origins trigger this event.
      var message = {
        source: {location: {href: "chrome://"}},
        data: request
      };
      Privly.message.receiveMessage(message);
    });
} else if( Privly.message.currentPlatform === "FIREFOX" ) {
  // todo jetpack
  console.warn("todo: This has not been implemented for Jetpack yet");
} else if( Privly.message.currentPlatform === "SAFARI" ) {
  // todo safari
  console.warn("todo: This has not been implemented for Safari yet");
} else if( Privly.message.currentPlatform === "HOSTED" ) {
  // pass, there is no messaging in the hosted environment
} else if( Privly.message.currentPlatform === "IOS" ) {
  // pass, mobile doesn't receive messages
} else if( Privly.message.currentPlatform === "ANDROID" ) {
  // pass, mobile doesn't receive messages
} else {
  console.error(
    "You attempted to initialize messaging on an unrecognized platform");
}
