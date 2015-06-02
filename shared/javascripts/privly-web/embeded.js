/**
 * @fileOverview This is a general adapter for interfacing with the Privly-web
 * server: github.com/privly/privly-web
 *
 * Its purpose is to allow all privly-web derived applications to interface
 * with privly-web through a consistent adapter, thereby speeding updates
 * and easing the generation of a large number of applications.
 *
 * It manages the general flow of an application that interfaces with the 
 * privly-web server but it is intended to be extended as necessary by
 * individual privly-applications. For example, see new.js in the PlainPost
 * Privly Application.
 *
 * This adapter provides embeded posting feature for Privly applications.
 **/

/*global chrome */
/*global window, Privly:true, privlyNetworkService, privlyParameters, privlyTooltip, EventEmitter */

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
     * Store the content of the editable element before inserting Privly URL.
     * When user cancels the posting process, the content will be reverted
     * based on this variable.
     * 
     * @type {String}
     */
    this.userContentBeforeInsertion = null;

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
   * Close this embed posting dialog (destroy iframe) and
   * return focus to the editable element.
   */
  EmbededAdapter.prototype.closeDialog = function () {
    chrome.runtime.sendMessage({
      ask: 'embeded/closePostDialog'
    });
    chrome.runtime.sendMessage({
      ask: 'embeded/focusTarget'
    });
  };

  /**
   * Trigger clicking submit button of the form of the
   * editable element if available.
   */
  EmbededAdapter.prototype.triggerSubmit = function () {
    chrome.runtime.sendMessage({
      ask: 'embeded/submit'
    });
  };

  /**
   * Get the content of the editable element.
   * Used to determine whether original form is submitted
   * (usually it will clear the editable element).
   * Also used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.getTargetContent = function (callback) {
    chrome.runtime.sendMessage({
      ask: 'embeded/getTargetContent'
    }, callback);
  };

  /**
   * Set the content of the editable element.
   * Used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @param {String} content value (textarea) or innerHTML (contentEditable)
   */
  EmbededAdapter.prototype.setTargetContent = function (content) {
    chrome.runtime.sendMessage({
      ask: 'embeded/setTargetContent',
      content: content
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
   */
  EmbededAdapter.prototype.emitEnterEvent = function (keys) {
    chrome.runtime.sendMessage({
      ask: 'embeded/emitEnterEvent',
      keys: keys
    });
  };

  /**
   * Get form information. Currently only the caption
   * of the submit button is retrived.
   * 
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.getFormInfo = function (callback) {
    chrome.runtime.sendMessage({
      ask: 'embeded/getFormInfo'
    }, callback);
  };

  /**
   * Insert Privly URL to the editable element.
   * 
   * @param  {String} link The link to insert
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.insertLink = function (link, callback) {
    chrome.runtime.sendMessage({
      ask: 'embeded/insertLink',
      link: link
    }, callback);
  };

  /**
   * Pop up a new window for user to log in.
   */
  EmbededAdapter.prototype.popupLoginDialog = function () {
    chrome.runtime.sendMessage({
      ask: 'embeded/popupLogin',
      loginCallbackUrl: '../Pages/EmbededLoginCallback.html'
    });
  };

  /**
   * Get processed request content from the Privly application.
   * 
   * @param  {String} content
   * @return {Object}
   *           {String} content
   *           {String} structured_content
   *           {Boolean} isPublic
   */
  EmbededAdapter.prototype.getRequestContent = function (content) {
    var reqContent;
    if (typeof this.application.getRequestContent === 'function') {
      reqContent = this.application.getRequestContent(content);
    } else {
      reqContent = {};
    }
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
  };

  /**
   * Get processed Privly link from the Privly application.
   * Privly application may manipulate the url to add additional
   * information.
   * 
   * @param  {String} link
   * @return {String} The processed link
   */
  EmbededAdapter.prototype.postprocessLink = function (link) {
    if (typeof this.application.postprocessLink === 'function') {
      return this.application.postprocessLink(link);
    }
    return link;
  };

  /**
   * Create an empty Privly URL. The Privly URL will be stored in
   * this.privlyUrl.
   * 
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.createLink = function (callback) {
    var self = this;

    var reqContent = self.getRequestContent('');
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

    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + '/posts',
      function (response) {
        var url = response.jqXHR.getResponseHeader('X-Privly-Url');
        url = self.postprocessLink(url);
        var reqUrl = privlyParameters.getParameterHash(url).privlyDataURL;
        self.privlyUrl = url;
        self.requestUrl = reqUrl;
        self.emit('afterCreateLink', url, reqUrl);
        callback && callback(true);
      },
      contentToPost
    );
  };

  /**
   * Update the content of the Privly URL provided by this.privlyUrl
   * according to the value of the textarea.
   * 
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.updateLink = function (callback) {
    var self = this;

    if (self.privlyUrl === null) {
      callback && callback(false);
      return;
    }

    // abort last update request
    if (self.lastUpdateXHR) {
      self.lastUpdateXHR.abort();
      self.lastUpdateXHR = null;
    }

    // doesn't allow user to manually trigger update
    $('.embeded-form button').attr('disabled', 'disabled');
    $('.embeded-form .saving-text').show();

    var url = self.privlyUrl;
    var reqUrl = self.requestUrl;
    var reqContent = self.getRequestContent($('textarea').val());
    var contentToPost = {
      "post": {
        "content": reqContent.content,
        "structured_content": reqContent.structured_content,
        "seconds_until_burn": $('#seconds_until_burn').val()
      },
      "format": "json"
    };

    // send
    self.lastUpdateXHR = privlyNetworkService.sameOriginPutRequest(
      reqUrl,
      function (response) {
        // re-enable controls
        $('.saving-text').hide();
        $('.embeded-form button').removeAttr('disabled');
        self.lastUpdateXHR = null;
        self.emit('afterUpdateLink', url, reqUrl);
        callback && callback(true);
      },
      contentToPost
    );
  };

  /**
   * Destroy the Privly URL provided by this.privlyUrl.
   * 
   * @param  {Function} callback
   */
  EmbededAdapter.prototype.deleteLink = function (callback) {
    var self = this;

    if (self.privlyUrl === null) {
      callback && callback(false);
      return;
    }

    // when deleting link, we no longer allow users to trigger update
    $('.embeded-form button').attr('disabled', 'disabled');

    var url = self.privlyUrl;
    var reqUrl = self.requestUrl;
    var contentToPost = {};

    privlyNetworkService.sameOriginDeleteRequest(
      reqUrl,
      function (response) {
        self.emit('afterDeleteLink', url, reqUrl);
        callback && callback(true);
      },
      contentToPost
    );
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
      self.getTargetContent(function (content) {
        if (
          content === false || (
            content.indexOf(self.privlyUrl) === -1 &&
            content.replace(/&amp;/g, '&').indexOf(self.privlyUrl) === -1
          )
        ) {
          clearInterval(self.clearObserver);
          self.clearObserver = null;
          self.closeDialog();
        }
      });
    }, self.options.observeInterval);
  };

  /**
   * Switch to the posting UI from initial loading UI
   */
  EmbededAdapter.prototype.switchToForm = function () {
    var self = this;

    // retrive submit button information (show 'submit' or 'done')
    self.getFormInfo(function (info) {
      if (info.hasSubmitButton) {
        $('button[name="submit"]').text(info.submitButtonText).show();
      } else {
        $('button[name="done"]').show();
      }
    });

    $('.login-check h3').text('Preparing your Privly link...');

    // 1. back up original content, in case of user cancels posting
    self.getTargetContent(function (content) {
      if (content === false) {
        self.closeDialog();
        return;
      }
      self.userContentBeforeInsertion = content;

      // 2. create a link with empty content
      self.createLink(function () {

        // 3. insert link to the target
        self.insertLink(self.privlyUrl, function (success) {
          if (!success) {
            self.closeDialog();
            return;
          }

          // 4. link has successfully inserted: show posting form
          $('.login-check').hide();
          $('.embeded-form').trigger('reposition').show();
          $('textarea').focus();
          self.beginContentClearObserver();
        });
      });
    });
  };

  /**
   * Switch to the login UI from initial loading UI
   * @return {[type]} [description]
   */
  EmbededAdapter.prototype.switchToLogin = function () {
    $('.login-check').hide();
    $('.login-required').show();
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

    // show glyph icon
    $('.glyph').append(privlyTooltip.glyphHTML());

    // when resizing window, we re-calculate the dialog position based on percentage value
    var $dialog = $('.embeded-form');
    $(window).resize(debounce(function () {
      $dialog.trigger('reposition');
    }, 200));

    $dialog.on('reposition', function () {
      var offsetLeft = Math.floor($(window).width() * parseFloat($dialog[0].getAttribute('data-left')) - $dialog.outerWidth() / 2);
      var offsetTop = Math.floor($(window).height() * parseFloat($dialog[0].getAttribute('data-top')) - $dialog.outerHeight() / 2);
      $dialog[0].style.left = offsetLeft + 'px';
      $dialog[0].style.top = offsetTop + 'px';
    });

    // Drag window
    // we set mousemove event listener on document element, to prevent
    // losing target when moving to fast
    $dialog.on('mousedown', function (ev) {
      if (ev.target.nodeName === 'TEXTAREA' || ev.target.nodeName === 'BUTTON' || ev.target.nodeName === 'SELECT') {
        return;
      }
      $dialog[0].style.willChange = 'left, top';
      // record start position
      var
        mouseStartX = ev.screenX,
        mouseStartY = ev.screenY,
        dialogX = $dialog.position().left,
        dialogY = $dialog.position().top;
      // bind event listener
      $(document).on('mousemove.drag', function (ev) {
        if (ev.which === 1) {
          var offsetLeft = dialogX + (ev.screenX - mouseStartX);
          var offsetTop = dialogY + (ev.screenY - mouseStartY);
          $dialog[0].style.left = offsetLeft + 'px';
          $dialog[0].style.top = offsetTop + 'px';
        }
      });
    });
    $dialog.on('mouseup', function () {
      $dialog[0].style.willChange = 'auto';
      // update dialog percentage value, for re-calculating
      // the position when user resizing window
      $dialog[0].setAttribute('data-left', ($dialog.position().left + $dialog.outerWidth() / 2) / $(window).width());
      $dialog[0].setAttribute('data-top', ($dialog.position().top + $dialog.outerHeight() / 2) / $(window).height());
      // clear event listener
      $(document).off('mousemove.drag');
    });

    $('[name="login"]').click(function () {
      self.popupLoginDialog();
    });

    $('[name="cancel"]').click(function () {
      self.deleteLink(function () {
        if (self.userContentBeforeInsertion !== null) {
          self.setTargetContent(self.userContentBeforeInsertion);
        }
        self.closeDialog();
      });
    });

    $('[name="done"]').click(function () {
      self.updateLink(function () {
        self.closeDialog();
      });
    });

    $('[name="submit"]').click(function () {
      self.updateLink(function () {
        self.triggerSubmit();
        self.closeDialog();
      });
    });

    $('#seconds_until_burn').change(function () {
      self.updateLink();
    });

    // add event listeners to forward ENTER key events
    $('textarea').keydown((function () {
      var onHitEnter = debounce(function (event) {
        self.updateLink(function () {
          self.emitEnterEvent({
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey,
          });
        });
      }, 300);
      return function (ev) {
        if (ev.which === 13) {
          onHitEnter(ev);
        }
      };
    }()));
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
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      self.switchToForm.bind(self),
      self.switchToLogin.bind(self),
      self.switchToLogin.bind(self)
    );
  };

  Privly.adapter.Embeded = EmbededAdapter;

}());
