/**
 * @fileOverview The seamless-posting adapter.
 *
 * This adapter is designed to be loaded in an seamless-posting iframe.
 * It needs seamless-posting content scripts to work correctly.
 *
 * The flow:
 *   User clicks Privly button
 *   Content Script creates an iframe and appends to the container
 *   This script gets loaded
 *     Initialize the Privly service
 *     Retrive the content of the target element
 *       Contains at least one Privly link?
 *         Is it editable?
 *           initial content = textareaContent.replace(privlyLink -> privlyLinkContent)
 *         Not?
 *           initial content = textareaContent
 *           create Privly link using the initial content
 *           textareaContent = privly link
 *       Not?
 *         initial content = textareaContent
 *         create Privly link using the initial content
 *         textareaContent = privly link
 *     Start observer
 *     App started
 * 
 */
/*global chrome */
/*global window, Privly:true, privlyNetworkService, privlyParameters, Promise */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}
if (Privly.app === undefined) {
  Privly.app = {};
}
if (Privly.app.viewAdapter === undefined) {
  Privly.app.viewAdapter = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.app.viewAdapter.Seamless !== undefined) {
    return;
  }

  /**
   * The seamless-posting generic adapter.
   * 
   * @param {Object} application The Privly application instance
   * @param {Object} options
   *          {Number} initialTTL Defaults to 86400. The initial content TTL 
   *                   in seconds. Seamless-posting will use this TTL when it
   *                   creates the link. Later it will be updated according
   *                   to user's selection of seconds_until_burn.
   *          {Number} observeInterval How often the observer runs. The observer
   *                   is used to periodically check whether the Privly link
   *                   inserted to the editable element is cleared (by the host
   *                   page). The form of the host page is likely to be submited
   *                   if the content is cleared. When the observer detects such
   *                   situation, it will just close the seamless-posting dialog.
   */
  var SeamlessAdapter = function (application, options) {
    /**
     * The Privly URL that is created to insert to the editable element.
     * 
     * @type {String}
     */
    this.privlyUrl = null;

    /**
     * The request URL of the privlyUrl. It is used to update or delete
     * the content that the privlyUrl contains.
     * 
     * @type {String}
     */
    this.requestUrl = null;

    /**
     * We store the last XHR object that invokes updating Privly URL
     * content. When invoking new requests, we need to abort the last one.
     * 
     * @type {jqXHR}
     */
    this.lastUpdateXHR = null;

    /**
     * The content clear observer is just a interval timer. This property
     * stores its intervalId for later use.
     * 
     * @type {Number}
     */
    this.clearObserver = null;

    /**
     * The Privly application instance.
     * 
     * @type {Object}
     */
    this.application = application;

    /**
     * Whether the seamless-posting form has started.
     * It should be started only once.
     * 
     * @type {Boolean}
     */
    this.started = false;

    this.sourceContextId = '';
    this.sourceResourceId = '';
    this.selfAppId = '';

    if (window.location.search.indexOf('?') === 0) {
      var query = privlyParameters.parameterStringToHash(window.location.search.substr(1));
      this.sourceContextId = query.contextid;
      this.sourceResourceId = query.resid;
      this.selfAppId = query.appid;
    }

    /**
     * Privly Application specified options.
     * 
     * @type {Object}
     *         {Number} initialTTL
     *         {Number} observeInterval
     */
    this.options = $.extend({}, {
      'initialTTL': 86400,
      'observeInterval': 300,
    }, options);

    /**
     * Seconds until burn settings
     * @type {Number}
     */
    this.ttl = this.options.initialTTL;

    /**
     * The regular expression that matches Privly link
     * @type {RegExp}
     */
    this.whitelistRegexp = new RegExp(
      // see http://jsfiddle.net/8huL9qbz/
      "\\b(https?:\\/\\/){0,1}(" + //protocol
      "priv\\.ly\\/|" + //priv.ly
      "dev\\.privly\\.org\\/|" + //dev.privly.org
      "localhost\\/|" + //localhost
      "privlyalpha.org\\/|" + //localhost
      "privlybeta.org\\/|" + //localhost
      "localhost:3000\\/" + //localhost:3000
      Privly.options.getWhitelistRegExp() +
      ")(\\S){3,}/[a-z0-9\._/~%\-\+&\#\?!=\(\)@]*", "i"
      // no global flag here. we only support matching one link
    );
  };

  // Inhreit EventEmitter
  Privly.EventEmitter.inherit(SeamlessAdapter);

  Privly.app.viewAdapter.Seamless = SeamlessAdapter;

  /**
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing.
   *
   * This function is used to throttle updating request when pressing ENTER.
   *
   * Ported from underscore.js
   * 
   * @param  {Function} func The function to throttle calling
   * @param  {Number} wait
   * @param  {Boolean} immediate Whether to trigger the function on the leading edge
   * @return {Function} The throttled function
   */
  SeamlessAdapter.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  };

  /**
   * Promise wrapper for sending message to the background script
   * 
   * @return {Promise}
   */
  SeamlessAdapter.prototype.messageExtension = function (message, hasResponse) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    // specify which context to be received
    messageToSend.targetContextId = this.sourceContextId;
    messageToSend.targetResourceId = this.sourceResourceId;
    messageToSend.hasResponse = hasResponse;
    return Privly.message.messageExtension(messageToSend, hasResponse);
  };

  /**
   * Send message that the textarea got focus
   *
   * @return {Promise}
   */
  SeamlessAdapter.prototype.msgTextareaFocused = function () {
    return this.messageExtension({
      action: 'posting/contentScript/textareaFocused',
    });
  };

  /**
   * Send message that the textarea blurred
   *
   * @return {Promise}
   */
  SeamlessAdapter.prototype.msgTextareaBlurred = function () {
    return this.messageExtension({
      action: 'posting/contentScript/textareaBlurred',
    });
  };

  /**
   * Send message to switch the Privly button into loading state
   *
   * @return {Promise}
   */
  SeamlessAdapter.prototype.msgStartLoading = function () {
    return this.messageExtension({
      action: 'posting/contentScript/loading',
      state: true
    });
  };

  /**
   * Send message to switch the Privly button from loading state
   *
   * @return {Promise}
   */
  SeamlessAdapter.prototype.msgStopLoading = function () {
    return this.messageExtension({
      action: 'posting/contentScript/loading',
      state: false
    });
  };

  /**
   * Send message to get the content of the editable element.
   * Used to determine whether original form is submitted
   * (usually it will clear the editable element).
   * Also used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @return  {Promise<String>} content
   */
  SeamlessAdapter.prototype.msgGetTargetContent = function () {
    return this.messageExtension({
      action: 'posting/contentScript/getTargetContent'
    }, true);
  };

  /**
   * Send message to get the text of the editable element.
   * 
   * @return {Promise<String>} text
   */
  SeamlessAdapter.prototype.msgGetTargetText = function () {
    return this.messageExtension({
      action: 'posting/contentScript/getTargetText'
    }, true);
  };

  /**
   * Send message to set the text of the editable element.
   * 
   * @param  {String} text
   * @return {Promise<Boolean>} Whether the operation succeeded
   */
  SeamlessAdapter.prototype.msgSetTargetText = function (text) {
    return this.messageExtension({
      action: 'posting/contentScript/setTargetText',
      text: text
    }, true);
  };

  /**
   * Send message to insert Privly URL to the editable element.
   * 
   * @param  {String} link The link to insert
   * @return  {Promise<Boolean>} Whether the operation succeeded
   */
  SeamlessAdapter.prototype.msgInsertLink = function (link) {
    return this.messageExtension({
      action: 'posting/contentScript/insertLink',
      link: link
    }, true);
  };

  /**
   * Send message to dispatch ENTER key events on the editable element
   * with the given modifier keys.
   * 
   * @param  {Object} keys Modifier keys
   *           {Boolean} ctrl
   *           {Boolean} shift
   *           {Boolean} alt
   *           {Boolean} meta
   * @return  {Promise<Boolean>} Whether the operation succeeded
   */
  SeamlessAdapter.prototype.msgEmitEnterEvent = function (keys) {
    return this.messageExtension({
      action: 'posting/contentScript/emitEnterEvent',
      keys: keys
    }, true);
  };

  /**
   * Send message to pop up a new window for user to log in.
   *
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.msgPopupLoginDialog = function () {
    return this.messageExtension({
      action: 'posting/background/popupLogin',
      loginCallbackUrl: '../Pages/SeamlessPostingLoginCallback.html'
    });
  };

  /**
   * Send message that the Privly seamless-posting app is closed
   *
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.msgAppClosed = function () {
    return this.messageExtension({
      action: 'posting/contentScript/appClosed'
    });
  };

  /**
   * Send message that the Privly seamless-posting app is loaded
   * 
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.msgAppStarted = function () {
    return this.messageExtension({
      action: 'posting/contentScript/appStarted'
    });
  };

  /**
   * Get processed request content from the Privly application.
   * 
   * @param  {String} content
   * @return {Promise<Object>}
   *           {String} content
   *           {String} structured_content
   *           {Boolean} isPublic
   */
  SeamlessAdapter.prototype.getRequestContent = function (content) {
    var promise;
    if (typeof this.application.getRequestContent === 'function') {
      promise = this.application.getRequestContent(content);
    } else {
      promise = Promise.resolve({});
    }
    return promise.then(function (reqContent) {
      if (reqContent.content === undefined) {
        reqContent.content = content;
      }
      if (reqContent.structured_content === undefined) {
        reqContent.structured_content = content;
      }
      if (reqContent.isPublic === undefined) {
        reqContent.isPublic = true;
      }
      return reqContent;
    });
  };

  /**
   * Get processed Privly link from the Privly application.
   * Privly application may manipulate the url to add additional
   * information.
   * 
   * @param  {String} link
   * @return {Promise<String>} The processed link
   */
  SeamlessAdapter.prototype.postprocessLink = function (link) {
    var promise;
    if (typeof this.application.postprocessLink === 'function') {
      promise = this.application.postprocessLink(link);
    } else {
      promise = Promise.resolve(link);
    }
    return promise;
  };

  /**
   * Get available TTL options from the Privly application.
   * 
   * @return {Promise<[Object]>}  TTL options
   *           {String} text      The text of the option
   *           {String} ttl       The seconds_util_burn value of the option
   *           {Boolean} default  Whether this option is the default option
   */
  SeamlessAdapter.prototype.getTTLOptions = function () {
    var promise;
    if (typeof this.application.getTTLOptions === 'function') {
      promise = this.application.getTTLOptions();
    } else {
      promise = Promise.resolve([]);
    }
    return promise;
  };

  /**
   * Try to load from an existing Privly link
   * 
   * @param  {String} url
   * @return {Promise<String>} the content of the link
   */
  SeamlessAdapter.prototype.loadLink = function (link) {
    var self = this;
    var url = privlyParameters.getApplicationUrl(link);
    var reqUrl = privlyParameters.getParameterHash(url).privlyDataURL;

    return new Promise(function (resolve) {
      privlyNetworkService.sameOriginGetRequest(reqUrl, resolve);
    })
      .then(function (response) {
        if (response.jqXHR.status !== 200) {
          return Promise.reject();
        }
        var json = response.json;
        var permission = {
          canUpdate: false,
          canDestroy: false
        };
        if (json.permissions) {
          permission.canUpdate = (json.permissions.canupdate === true);
          permission.canDestroy = (json.permissions.candestroy === true);
        }

        // no permission to update: reject it
        if (!permission.canUpdate || !permission.canDestroy) {
          return Promise.reject();
        }
        // got plain text!
        return self.application.loadRawContent(url, json);
      })
      .then(function (plaintext) {
        self.privlyUrl = url;
        self.requestUrl = reqUrl;
        return plaintext;
      });
  };

  /**
   * Create an empty Privly URL. The Privly URL will be stored in
   * this.privlyUrl.
   * 
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.createLink = function () {
    var self = this;
    return self
      .getRequestContent($('textarea').val())
      .then(function (json) {
        var contentToPost = {
          "post": {
            "content": json.content,
            "structured_content": json.structured_content,
            "public": json.isPublic,
            "privly_application": self.application.name,
            "seconds_until_burn": self.options.initialTTL
          },
          "format": "json"
        };
        return new Promise(function (resolve) {
          privlyNetworkService.sameOriginPostRequest(
            privlyNetworkService.contentServerDomain() + '/posts',
            resolve,
            contentToPost
          );
        })
      })
      .then(function (response) {
        var url = response.jqXHR.getResponseHeader('X-Privly-Url');
        return self
          .postprocessLink(url)
          .then(function (url) {
            var reqUrl = privlyParameters.getParameterHash(url).privlyDataURL;
            self.privlyUrl = url;
            self.requestUrl = reqUrl;
            return self.emitAsync('afterCreateLink', url, reqUrl);
          });
      })
      .then(function () {
        return self.privlyUrl;
      });
  };

  /**
   * Update the content of the Privly URL provided by this.privlyUrl
   * according to the value of the textarea.
   * 
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.updateLink = function () {
    var self = this;

    if (self.privlyUrl === null) {
      return Promise.resolve();
    }

    // abort last update request
    if (self.lastUpdateXHR) {
      self.lastUpdateXHR.abort();
      self.lastUpdateXHR = null;
    }

    var url = self.privlyUrl;
    var reqUrl = self.requestUrl;

    return self
      .getRequestContent($('textarea').val())
      .then(function (json) {
        var contentToPost = {
          "post": {
            "content": json.content,
            "structured_content": json.structured_content,
            "seconds_until_burn": self.ttl
          },
          "format": "json"
        };
        return new Promise(function (resolve) {
          self.lastUpdateXHR = privlyNetworkService.sameOriginPutRequest(reqUrl, resolve, contentToPost);
        });
      })
      .then(function () {
        // re-enable controls
        $('.saving-text').hide();
        $('.posting-form button').removeAttr('disabled');
        self.lastUpdateXHR = null;
      })
      .then(self.emitAsync.bind(self, 'afterUpdateLink', url, reqUrl));
  };

  /**
   * Destroy the Privly URL provided by this.privlyUrl.
   * 
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.deleteLink = function () {
    var self = this;

    if (self.privlyUrl === null) {
      return Promise.resolve();
    }

    // when deleting link, we no longer allow users to trigger update
    $('.posting-form button').attr('disabled', 'disabled');

    var url = self.privlyUrl;
    var reqUrl = self.requestUrl;
    var contentToPost = {};

    return self
      .msgStartLoading()
      .then(function () {
        return new Promise(function (resolve) {
          privlyNetworkService.sameOriginDeleteRequest(
            reqUrl,
            resolve,
            contentToPost
          );
        });
      })
      .then(self.emitAsync.bind(self, 'afterDeleteLink', url, reqUrl))
      .then(self.msgStopLoading.bind(self));
  };

  /**
   * Start the observation of the removal of Privly URL in editable element.
   * If Privly URL is removed in the content of the editable element,
   * we should close the embed-posting dialog.
   */
  SeamlessAdapter.prototype.beginContentClearObserver = function () {
    var self = this;

    if (self.clearObserver) {
      return;
    }

    self.clearObserver = setInterval(function () {
      self.msgGetTargetContent()
        .then(function (content) {
          if (
            content === false || (
              content.indexOf(self.privlyUrl) === -1 &&
              content.replace(/&amp;/g, '&').indexOf(self.privlyUrl) === -1
            )
          ) {
            clearInterval(self.clearObserver);
            self.clearObserver = null;
            self.msgAppClosed();
          }
        });
    }, self.options.observeInterval);
  };

  /**
   * Switch to the posting UI from initial loading UI.
   *
   * @return {Promise}
   */
  SeamlessAdapter.prototype.onConnectionCheckSucceeded = function () {
    var self = this;
    return self
      .emitAsync('connectionCheckSucceeded')
      .then(self.getTTLOptions.bind(self))
      .then(function (options) {
        var i;
        for (i = 0; i < options.length; ++i) {
          if (options[i].default) {
            self.ttl = options[i].ttl;
            break;
          }
        }
      })
      .then(self.msgGetTargetText.bind(self))
      .then(function (text) {
        // does not contain a privly link
        if (!self.whitelistRegexp.test(text)) {
          return Promise.reject(text);
        }
        var link = self.whitelistRegexp.exec(text)[0];
        // contains link, try to get its content and meta data
        return self.loadLink(link)
          .then(function (plaintext) {
            return {text: text, content: plaintext};
          }, function () {
            return Promise.reject(text);
          });
      })
      .then(function (data) {
        // resolved: the link content can be used as the initial content
        $('textarea').val(data.text.replace(self.whitelistRegexp, data.content));
      }, function (text) {
        // rejected: cannot use the link content as the initial content
        $('textarea').val(text);
        return self.createLink()
          .then(self.msgInsertLink.bind(self))
          .then(function (insertionSuccess) {
            if (insertionSuccess === false) {
              return Promise.reject();
            }
          });
      })
      .then(self.msgStopLoading.bind(self))
      .then(self.msgAppStarted.bind(self))
      .then(self.beginContentClearObserver.bind(self))
      .then(null, function () {
        // handle rejected: link insertion failed
        return self
          .deleteLink()
          .then(self.msgStopLoading.bind(self))
          .then(self.msgAppClosed.bind(self));
      });
  };

  /**
   * Switch to the login UI from initial loading UI
   * 
   * @return {Promise}
   */
  SeamlessAdapter.prototype.onConnectionCheckFailed = function () {
    var self = this;
    return self
      .emitAsync('connectionCheckFailed')
      .then(self.msgStopLoading.bind(self))
      .then(self.msgPopupLoginDialog.bind(self))
      .then(self.msgAppClosed.bind(self));
  };

  /**
   * Textarea keypress event handler
   * 
   * @return {Promise}
   */
  SeamlessAdapter.prototype.onHitKey = function (ev) {
    var self = this;
    return self
      .updateLink()
      .then(function () {
        if (ev.keyCode === 13) {
          return self.msgEmitEnterEvent({
            ctrl: ev.ctrlKey,
            alt: ev.altKey,
            shift: ev.shiftKey,
            meta: ev.metaKey,
          });
        }
      });
  };

  /**
   * Fired when Privly app receives messages
   * 
   * @param  {Object} message
   * @param  {Function} sendResponse
   */
  SeamlessAdapter.prototype.onMessageReceived = function (message) {
    var self = this;
    switch (message.action) {
    case 'posting/app/userClose':
      self.onUserClose();
      break;
    case 'posting/app/updateStyles':
      self.updateStyle(message.styles);
      break;
    case 'posting/app/stateChanged':
      self.onStateChanged(message.state);
      break;
    case 'posting/app/setTTL':
      self.onSetTTL(message.ttl);
      break;
    }
  };

  /**
   * When user sets TTL
   * 
   * @param  {String} ttl
   */
  SeamlessAdapter.prototype.onSetTTL = function (ttl) {
    this.ttl = ttl;
    this.updateLink();
  };

  /**
   * Update the style of the seamless-posting textarea according to the host site
   * 
   * @param  {Object} styles
   */
  SeamlessAdapter.prototype.updateStyle = function (styles) {
    var inputElement = $('textarea')[0];
    var styleName;
    for (styleName in styles) {
      inputElement.style[styleName] = styles[styleName];
    }
  };

  /**
   * The handler when state got changed.
   * 
   * iframe created(hide) -> prepare link -> app started
   * -> (focus iframe) -> state changed to open -> (focus textarea)
   *
   * Although this context fired "appStart" message,
   * but at that time the iframe has not got the focus
   * thus focusing the textarea has no effect.
   * 
   * @param  {String} state
   */
  SeamlessAdapter.prototype.onStateChanged = function (state) {
    switch (state) {
    case 'OPEN':
      $('textarea').focus();
      break;
    }
  };

  /**
   * The handler when user clicks "Close" button.
   *
   * @return  {Promise}
   */
  SeamlessAdapter.prototype.onUserClose = function () {
    var self = this;
    return self
      .deleteLink()
      .then(self.msgSetTargetText.bind(self, $('textarea').val()))
      .then(self.msgAppClosed.bind(self));
  };

  /**
   * Start the seamless-posting adapter
   */
  SeamlessAdapter.prototype.start = function () {
    var self = this;
    if (self.started) {
      return;
    }
    self.started = true;

    $('textarea').focus(function () {
      self.msgTextareaFocused();
    });

    $('textarea').blur(function () {
      self.msgTextareaBlurred();
    });

    // add event listeners to forward ENTER key events
    $('textarea').keydown((function () {
      var debouncedListener = SeamlessAdapter.debounce(self.onHitKey.bind(self), 300);
      return function (ev) {
        debouncedListener(ev);
      };
    }()));

    // receive incoming messages
    Privly.message.addListener(function (message, sendResponse) {
      if (message.targetAppId !== self.selfAppId) {
        return;
      }
      return self.onMessageReceived(message, sendResponse);
    });

    self.msgStartLoading();

    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      self.onConnectionCheckSucceeded.bind(self),
      self.onConnectionCheckFailed.bind(self),
      self.onConnectionCheckFailed.bind(self)
    );
  };

}());