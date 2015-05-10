/**
 *
 * This is the embed posting Privly application.
 *
 * When user is not logged in, it send messages to the background script
 * in order to pop up a new window for user to log in.
 *
 *    Because of login process only supporting redirecting to an URL after
 *    successfully logged in, we create new_embed_login_callback.html. What
 *    that page does is just sending messages to nofity that the login
 *    process is completed.
 *
 * When user is logged in and the network connection is OK, it will show
 * a textarea for user to write Privly message and a submit button to submit
 * the form (if feasible) and/or close the embed posting dialog.
 * 
 */

/*global chrome:false, ls:true, privlyNetworkService:false, privlyParameters:false, sjcl:false, zeroCipher:false */

/**
 * The Privly URL that is created to insert to the editable element.
 * @type {String}
 */
var privlyLink = null;

/**
 * The cipher key of the Privly URL. We need this cipher key in order
 * to update the content of the Privly URL.
 * 
 * @type {Object}
 */
var privlyCipherKey = null;

/**
 * We store the last XHR object that invokes updating Privly URL
 * content. When invoking new requests, we need to abort the last one.
 * 
 * @type {jqXHR}
 */
var lastUpdateXHR = null;

/**
 * Store the content of the editable element before inserting Privly URL.
 * When user cancels the posting process, the content will be reverted
 * based on this variable.
 * 
 * @type {String}
 */
var contentBeforeInsertion = null;

/**
 * This function add the decryption key to the anchor of the URL
 * created by privlyWeb.createLink. It stores the Privly URL
 * in privlyLink variable.
 *
 * @param {jqxhr} response The response from the server containing the
 * URL that needs to be modified.
 * @param {string} randomkey The decryption key for the content held at the
 * server.
 * @param {string} The URL with the link key appended.
 */
function processURL(response, randomkey) {
  if (response.jqXHR.status !== 201) {
    return "";
  }
  var url = response.jqXHR.getResponseHeader("X-Privly-Url");
  if (url.indexOf("#") > 0) {
    url = url.replace("#", "#privlyLinkKey=" + randomkey);
  } else {
    url = url + "#privlyLinkKey=" + randomkey;
  }

  // Save the URL to localStorage if we are not in the HOSTED platform
  if (privlyNetworkService.platformName() !== "HOSTED") {
    var urls = ls.getItem("Message:URLs");
    if (urls !== undefined) {
      urls.push(url);
      ls.setItem("Message:URLs", urls);
    } else {
      ls.setItem("Message:URLs", [url]);
    }
  }

  privlyLink = url;
  return url;
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
 * Encapsuled APIs to send messages to the background script.
 * 
 * @type {Object}
 */
var background = {
  /**
   * Close this embed posting dialog (destroy iframe) and
   * return focus to the editable element.
   */
  closeDialog: function () {
    chrome.runtime.sendMessage({
      ask: 'posting/close_post_dialog'
    });
    chrome.runtime.sendMessage({
      ask: 'posting/focus_target'
    });
  },

  /**
   * Trigger clicking submit button of the form of the
   * editable element if available.
   */
  triggerSubmit: function () {
    chrome.runtime.sendMessage({
      ask: 'posting/submit'
    });
  },

  /**
   * Get the content of the editable element.
   * Used to determine whether original form is submitted
   * (usually it will clear the editable element).
   * Also used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @param  {Function} callback
   */
  getTargetContent: function (callback) {
    chrome.runtime.sendMessage({
      ask: 'posting/get_target_content'
    }, callback);
  },

  /**
   * Set the content of the editable element.
   * Used to revert content of the editable element
   * when user cancels embed posting process.
   * 
   * @param {String} content value (textarea) or innerHTML (contentEditable)
   */
  setTargetContent: function (content) {
    chrome.runtime.sendMessage({
      ask: 'posting/set_target_content',
      content: content
    });
  },

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
  emitEnterEvent: function (keys) {
    chrome.runtime.sendMessage({
      ask: 'posting/on_keydown_enter',
      keys: keys
    });
  },

  /**
   * Get form information. Currently only the caption
   * of the submit button is retrived.
   * 
   * @param  {Function} callback
   */
  getFormInfo: function (callback) {
    chrome.runtime.sendMessage({
      ask: 'posting/get_form_info'
    }, callback);
  },

  /**
   * Insert Privly URL to the editable element.
   * 
   * @param  {String} link The link to insert
   * @param  {Function} callback
   */
  insertLink: function (link, callback) {
    chrome.runtime.sendMessage({
      ask: 'posting/insert_link',
      link: link
    }, callback);
  },

  /**
   * Pop up a new window for user to log in.
   */
  popupLoginDialog: function () {
    chrome.runtime.sendMessage({
      ask: 'posting/popup_login',
      loginCallbackUrl: '../Message/new_embed_login_callback.html'
    });
  },
};

/**
 * Encapsuled APIs to send Privly web requests.
 * 
 * @type {Object}
 */
var privlyWeb = {
  /**
   * Create an empty Privly URL. This function stores the cipher key
   * in privlyCipherKey variable. The Privly URL will be stored in
   * privlyLink in processURL function.
   * 
   * @param  {Function} callback
   */
  createLink: function (callback) {
    // prepare payload
    var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
    var cipherdata = zeroCipher(randomkey, '');

    privlyCipherKey = randomkey;

    var contentToPost = {
      "post": {
        "content": "",
        "structured_content": cipherdata,
        "privly_application": "Message",
        // We use 1 day here, to automatically clean those canceled messages.
        "seconds_until_burn": "86400",
        "public": true
      },
      "format": "json"
    };

    // send
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts",
      function (response) {
        processURL(response, randomkey);
        callback && callback(true);
      },
      contentToPost
    );
  },

  /**
   * Update the content of the Privly URL provided by privlyLink varibale
   * according to the value of the textarea.
   * 
   * @param  {Function} callback
   */
  updateLink: function (callback) {
    if (privlyLink === null) {
      callback && callback(false);
      return;
    }

    // abort existing update progress
    if (lastUpdateXHR) {
      lastUpdateXHR.abort();
      lastUpdateXHR = null;
    }

    // doesn't allow user to manually trigger update
    $('.message-posting-dialog button').attr('disabled', 'disabled');
    $('.saving-text').show();

    // get PUT URL
    var dataURL = privlyParameters.getParameterHash(privlyLink).privlyDataURL;

    // prepare payload
    var cipherdata = zeroCipher(privlyCipherKey, $("textarea").val());
    var contentToPost = {
      "post": {
        "structured_content": cipherdata,
        "seconds_until_burn": $("#seconds_until_burn").val()
      },
      format: "json"
    };

    // send
    lastUpdateXHR = privlyNetworkService.sameOriginPutRequest(
      dataURL,
      function (response) {
        // re-enable controls
        $('.saving-text').hide();
        $('.message-posting-dialog button').removeAttr('disabled');
        lastUpdateXHR = null;
        callback && callback(true);
      },
      contentToPost
    );
  },

  /**
   * Destroy the Privly URL provided by privlyLink variable.
   * 
   * @param  {Function} callback
   */
  deleteLink: function (callback) {
    if (privlyLink === null) {
      callback && callback(false);
      return;
    }

    // when deleting link, we no longer allow users to trigger update
    $('.message-posting-dialog button').attr('disabled', 'disabled');

    var dataURL = privlyParameters.getParameterHash(privlyLink).privlyDataURL;

    privlyNetworkService.sameOriginDeleteRequest(
      dataURL,
      function (response) {
        callback && callback(true);
      },
      {}
    );
  }
};

/**
 * Start the observation of the removal of Privly URL in editable element.
 * If Privly URL is removed in the content of the editable element,
 * we should close the embed-posting dialog.
 */
function beginCloseObserve() {
  if (beginCloseObserve.intervalId) {
    return;
  }
  beginCloseObserve.intervalId = setInterval(function () {
    background.getTargetContent(function (content) {
      if (
        content === false || (
          content.indexOf(privlyLink) === -1 &&
          content.replace(/&amp;/g, '&').indexOf(privlyLink) === -1
        )
      ) {
        background.closeDialog();
      }
    });
  }, 1000);
}

/**
 * Callback functions related to the checking of login process.
 * 
 * @type {Object}
 */
var loginCheckingCallback = {
  /**
   * The callback when user is logged in
   */
  logined: function () {
    // retrive submit button information (show 'submit' or 'done')
    background.getFormInfo(function (info) {
      if (info.hasSubmitButton) {
        $('[name="submit"]').text(info.submitButtonText).show();
      } else {
        $('[name="done"]').show();
      }
    });

    $('.login-check h3').text('Preparing your Privly link...');

    // 1. back up original content, in case of user cancels posting
    background.getTargetContent(function (content) {
      if (content === false) {
        background.closeDialog();
        return;
      }
      contentBeforeInsertion = content;

      // 2. create a link with empty content
      privlyWeb.createLink(function () {

        // 3. insert link to the target
        background.insertLink(privlyLink, function (success) {
          if (!success) {
            background.closeDialog();
            return;
          }

          // 4. link has successfully inserted: show posting form
          $('.login-check').hide();
          $('.message-posting-dialog').show();
          $('textarea').focus();
          beginCloseObserve();
        });
      });
    });

  },

  /**
   * The callback function when user is not logged in.
   */
  notlogined: function () {
    $('.login-check').hide();
    $('.login-required').show();
  },

  /**
   * The callback function when there is an error checking user status
   */
  error: function () {
    this.notlogined();
  }
};

/**
 * Reset variables. In testing mode, those values will be referenced cross
 * test cases, so we should reset those variables.
 */
function resetGlobals() {
  privlyLink = null;
  privlyCipherKey = null;
  lastUpdateXHR = null;
  contentBeforeInsertion = null;
}

/**
 * Attach event handlers
 */
function attachEventHandlers() {
  $('[name="login"]').click(function () {
    background.popupLoginDialog();
  });

  $('[name="cancel"]').click(function () {
    privlyWeb.deleteLink(function () {
      if (contentBeforeInsertion) {
        background.setTargetContent(contentBeforeInsertion);
      }
      background.closeDialog();
    });
  });

  $('[name="done"]').click(function () {
    privlyWeb.updateLink(function () {
      background.closeDialog();
    });
  });

  $('[name="submit"]').click(function () {
    privlyWeb.updateLink(function () {
      background.triggerSubmit();
      background.closeDialog();
    });
  });

  $('#seconds_until_burn').change(function () {
    privlyWeb.updateLink();
  });

  // add event listeners to forward ENTER key events
  $('textarea').keydown((function () {
    var onHitEnter = debounce(function (event) {
      privlyWeb.updateLink(function () {
        background.emitEnterEvent({
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
}

/**
 * The start up function
 */
function setup() {
  resetGlobals();
  attachEventHandlers();
  privlyNetworkService.initPrivlyService(
    privlyNetworkService.contentServerDomain(),
    loginCheckingCallback.logined.bind(loginCheckingCallback),
    loginCheckingCallback.notlogined.bind(loginCheckingCallback),
    loginCheckingCallback.error.bind(loginCheckingCallback)
  );
}

document.addEventListener('DOMContentLoaded', setup);