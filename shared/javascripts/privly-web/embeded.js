/*global chrome */
/*global window, Privly:true, privlyNetworkService, privlyParameters, Promise */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}
if (Privly.adapter === undefined) {
  Privly.adapter = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.adapter.Embeded !== undefined) {
    return;
  }

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
  function debounce(func, wait, immediate) {
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
  }

  /**
   * The embeded-posting generic adapter.
   * 
   * @param {Object} application The Privly application instance
   * @param {Object} options
   *          {Number} initialTTL Defaults to 86400. The initial content TTL 
   *                   in seconds. Embeded-posting will use this TTL when it
   *                   creates the link. Later it will be updated according
   *                   to user's selection of seconds_until_burn.
   *          {Number} observeInterval How often the observer runs. The observer
   *                   is used to periodically check whether the Privly link
   *                   inserted to the editable element is cleared (by the host
   *                   page). The form of the host page is likely to be submited
   *                   if the content is cleared. When the observer detects such
   *                   situation, it will just close the embeded-posting dialog.
   */
  var EmbededAdapter = function (application, options) {
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
     * Whether the embeded-posting DOM has initialized.
     * It should be initialized only once.
     * 
     * @type {Boolean}
     */
    this.initialized = false;

    /**
     * Whether the embeded-posting form has started.
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
  };

  // Inhreit EventEmitter
  Privly.EventEmitter.inherit(EmbededAdapter);

  /**
   * Promise wrapper for sending message to the background script
   * 
   * @return {Promise}
   */
  EmbededAdapter.prototype.messageExtension = function (message) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    // specify which context to be received
    messageToSend.targetContextId = this.sourceContextId;
    messageToSend.targetResourceId = this.sourceResourceId;
    return Privly.message.messageExtension(messageToSend);
  };


  EmbededAdapter.prototype.msgStartLoading = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/loading',
      state: true
    });
  };

  EmbededAdapter.prototype.msgStopLoading = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/loading',
      state: false
    });
  };

  /**
   * Get the content of the editable element.
   * Used to determine whether original form is submitted
   * (usually it will clear the editable element).
   * Also used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @return  {Promise}
   */
  EmbededAdapter.prototype.msgGetTargetContent = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/getTargetContent'
    });
  };

  EmbededAdapter.prototype.msgGetTargetText = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/getTargetText'
    });
  };

  EmbededAdapter.prototype.msgSetTargetText = function (text) {
    return this.messageExtension({
      action: 'embeded/contentScript/setTargetText',
      text: text
    });
  };


  /**
   * Insert Privly URL to the editable element.
   * 
   * @param  {String} link The link to insert
   * @return  {Promise}
   */
  EmbededAdapter.prototype.insertLink = function (link) {
    return this.messageExtension({
      action: 'embeded/contentScript/insertLink',
      link: link
    });
  };


  /**
   * Dispatch ENTER key events on the editable element
   * with the given modifier keys.
   * 
   * @param  {Object} keys Modifier keys
   *           {Boolean} ctrl
   *           {Boolean} shift
   *           {Boolean} alt
   *           {Boolean} meta
   * @return  {Promise}
   */
  EmbededAdapter.prototype.msgEmitEnterEvent = function (keys) {
    return this.messageExtension({
      action: 'embeded/contentScript/emitEnterEvent',
      keys: keys
    });
  };

  /**
   * Pop up a new window for user to log in.
   *
   * @return  {Promise}
   */
  EmbededAdapter.prototype.msgPopupLoginDialog = function () {
    return this.messageExtension({
      action: 'embeded/background/popupLogin',
      loginCallbackUrl: '../Pages/EmbededLoginCallback.html'
    });
  };

  EmbededAdapter.prototype.msgAppClosed = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/appClosed'
    });
  };

  EmbededAdapter.prototype.msgAppStarted = function () {
    return this.messageExtension({
      action: 'embeded/contentScript/appStarted'
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
  EmbededAdapter.prototype.getRequestContent = function (content) {
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
  EmbededAdapter.prototype.postprocessLink = function (link) {
    var promise;
    if (typeof this.application.postprocessLink === 'function') {
      promise = this.application.postprocessLink(link);
    } else {
      promise = Promise.resolve(link);
    }
    return promise;
  };

  /**
   * Create an empty Privly URL. The Privly URL will be stored in
   * this.privlyUrl.
   * 
   * @return  {Promise}
   */
  EmbededAdapter.prototype.createLink = function () {
    var self = this;

    return self
      .getRequestContent($('textarea').val())
      .then(function (reqContent) {
        var contentToPost = {
          "post": {
            "content": reqContent.content,
            "structured_content": reqContent.structured_content,
            "public": reqContent.isPublic,
            "privly_application": self.application.name,
            "seconds_until_burn": self.options.initialTTL
          },
          "format": "json"
        };

        return new Promise(function (resolve) {
          privlyNetworkService.sameOriginPostRequest(
            privlyNetworkService.contentServerDomain() + '/posts',
            function (response) {
              var url = response.jqXHR.getResponseHeader('X-Privly-Url');
              self
                .postprocessLink(url)
                .then(function (url) {
                  var reqUrl = privlyParameters.getParameterHash(url).privlyDataURL;
                  self.privlyUrl = url;
                  self.requestUrl = reqUrl;
                  return self.emitAsync('afterCreateLink', url, reqUrl);
                })
                .then(resolve);
            },
            contentToPost
          );
        });
      });
  };

  // TODO: update when losing focus

  /**
   * Update the content of the Privly URL provided by this.privlyUrl
   * according to the value of the textarea.
   * 
   * @return  {Promise}
   */
  EmbededAdapter.prototype.updateLink = function () {
    var self = this;

    if (self.privlyUrl === null) {
      return Promise.resolve();
    }

    // abort last update request
    if (self.lastUpdateXHR) {
      self.lastUpdateXHR.abort();
      self.lastUpdateXHR = null;
    }

    // TODO: should we show update spinner?
    return self
      .getRequestContent($('textarea').val())
      .then(function (reqContent) {
        var url = self.privlyUrl;
        var reqUrl = self.requestUrl;
        var contentToPost = {
          "post": {
            "content": reqContent.content,
            "structured_content": reqContent.structured_content,
            "seconds_until_burn": $('#seconds_until_burn').val()
          },
          "format": "json"
        };

        return new Promise(function (resolve) {
          self.lastUpdateXHR = privlyNetworkService.sameOriginPutRequest(
            reqUrl,
            function () {
              // re-enable controls
              $('.saving-text').hide();
              $('.embeded-form button').removeAttr('disabled');
              self.lastUpdateXHR = null;
              self.emitAsync('afterUpdateLink', url, reqUrl).then(resolve);
            },
            contentToPost
          );
        });
      })
      .then(self.msgStopLoading.bind(self));
  };

  /**
   * Destroy the Privly URL provided by this.privlyUrl.
   * 
   * @return  {Promise}
   */
  EmbededAdapter.prototype.deleteLink = function () {
    var self = this;

    if (self.privlyUrl === null) {
      return Promise.resolve();
    }

    // when deleting link, we no longer allow users to trigger update
    $('.embeded-form button').attr('disabled', 'disabled');

    var url = self.privlyUrl;
    var reqUrl = self.requestUrl;
    var contentToPost = {};

    return self
      .msgStartLoading()
      .then(function () {
        return new Promise(function (resolve) {
          privlyNetworkService.sameOriginDeleteRequest(
            reqUrl,
            function () {
              self.emitAsync('afterDeleteLink', url, reqUrl).then(resolve);
            },
            contentToPost
          );
        });
      })
      .then(self.msgStopLoading.bind(self));
  };

  /**
   * Start the observation of the removal of Privly URL in editable element.
   * If Privly URL is removed in the content of the editable element,
   * we should close the embed-posting dialog.
   */
  EmbededAdapter.prototype.beginContentClearObserver = function () {
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
  EmbededAdapter.prototype.onConnectionCheckSucceeded = function () {
    var self = this;
    return self
      .emitAsync('connectionCheckSucceeded')
      .then(self.msgGetTargetText.bind(self))
      .then(function (text) {
        $('textarea').val(text);
      })
      .then(self.createLink.bind(self))
      .then(function () {
        return self.insertLink(self.privlyUrl);
      })
      .then(function (insertionSuccess) {
        if (insertionSuccess === false) {
          return Promise.reject();
        }
      })
      .then(self.msgStopLoading.bind(self))
      .then(self.msgAppStarted.bind(self))
      .then(function () {
        self.beginContentClearObserver();
      })
      .then(null, function () {
        return self
          .deleteLink()
          .then(self.msgAppClosed.bind(this))
          .then(Promise.reject);
      });
  };

  /**
   * Switch to the login UI from initial loading UI
   * 
   * @return {Promise}
   */
  EmbededAdapter.prototype.onConnectionCheckFailed = function () {
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
  EmbededAdapter.prototype.onHitKey = function (ev) {
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

  EmbededAdapter.prototype.onMessageReceived = function (message) {
    var self = this;
    switch (message.action) {
    case 'embeded/app/userClose':
      self.onUserClose();
      break;
    case 'embeded/app/updateStyles':
      self.updateStyle(message.styles);
      break;
    case 'embeded/app/stateChanged':
      self.onStateChanged(message.state);
      break;
    }
  };

  EmbededAdapter.prototype.updateStyle = function (styles) {
    var inputElement = $('textarea')[0];
    var styleName;
    for (styleName in styles) {
      inputElement.style[styleName] = styles[styleName];
    }
  };

  EmbededAdapter.prototype.onStateChanged = function (state) {
    switch (state) {
    case 'OPEN':
      $('textarea').focus();
      break;
    }
  };

  EmbededAdapter.prototype.onUserClose = function () {
    var self = this;
    return self
      .deleteLink()
      .then(function () {
        return self.msgSetTargetText($('textarea').val());
      })
      .then(self.msgAppClosed.bind(self));
  };

  /**
   * Bind event listeners. This function should be called after
   * complete loading the document.
   */
  EmbededAdapter.prototype.init = function () {
    var self = this;

    if (self.initialized) {
      return;
    }
    self.initialized = true;

    // add event listeners to forward ENTER key events
    $('textarea').keydown((function () {
      var debouncedListener = debounce(self.onHitKey.bind(self), 300);
      return function (ev) {
        debouncedListener(ev);
      };
    }()));

    // receive incoming messages
    Privly.message.addListener(function (message) {
      if (message.targetAppId !== self.selfAppId) {
        return;
      }
      self.onMessageReceived(message);
    });
  };

  /**
   * Start the embeded-posting adapter
   */
  EmbededAdapter.prototype.start = function () {
    var self = this;
    if (self.started) {
      return;
    }
    self.started = true;
    if (!self.initialized) {
      self.init();
    }

    self.msgStartLoading();

    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      self.onConnectionCheckSucceeded.bind(self),
      self.onConnectionCheckFailed.bind(self),
      self.onConnectionCheckFailed.bind(self)
    );
  };

  Privly.adapter.Embeded = EmbededAdapter;

}());
