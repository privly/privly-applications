(function(window, document, undefined) {

  var privlyLink = null;
  var privlyCipherKey = null;

  var lastUpdateXHR = null;
  var contentBeforeInsertion = null;

  /**
   * Add the decryption key to the anchor of the URL.
   *
   * @param {jqxhr} response The response from the server containing the
   * URL that needs to be modified.
   * @param {string} randomkey The decryption key for the content held at the
   * server.
   * @param {string} The URL with the link key appended.
   */
  function processURL(response, randomkey) {
    if( response.jqXHR.status !== 201 ) {
      return "";
    }
    var url = response.jqXHR.getResponseHeader("X-Privly-Url");
    if( url.indexOf("#") > 0 ) {
      url = url.replace("#", "#privlyLinkKey="+randomkey);
    } else {
      url = url + "#privlyLinkKey=" + randomkey;
    }

    // Save the URL to localStorage if we are not in the HOSTED platform
    if ( privlyNetworkService.platformName() !== "HOSTED" ) {
      var urls = ls.getItem("Message:URLs");
      if ( urls !== undefined ) {
        urls.push(url);
        ls.setItem("Message:URLs", urls);
      } else {
        ls.setItem("Message:URLs", [url]);
      }
    }
    return url;
  }

  /**
   * Ported from underscore.js
   * 
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing. 
   */
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * APIs to send message to background script
   * @type {Object}
   */
  var background = {
    closeDialog: function() {
      chrome.runtime.sendMessage({
        ask: 'posting/close_post_dialog'
      });
      chrome.runtime.sendMessage({
        ask: 'posting/focus_target'
      });
    },
    triggerSubmit: function() {
      chrome.runtime.sendMessage({
        ask: 'posting/submit'
      });
    },
    getTargetContent: function(callback) {
      chrome.runtime.sendMessage({
        ask: 'posting/get_target_content'
      }, callback);
    },
    setTargetContent: function(content) {
      chrome.runtime.sendMessage({
        ask: 'posting/set_target_content',
        content: content
      });
    },
    emitEnterEvent: function(keys) {
      chrome.runtime.sendMessage({
        ask: 'posting/on_keypress_enter',
        keys: keys
      });
    },
    getFormInfo: function(callback) {
      chrome.runtime.sendMessage({
        ask: 'posting/get_form_info'
      }, callback);
    },
    insertLink: function(link, callback) {
      chrome.runtime.sendMessage({
        ask: 'posting/insert_link',
        link: link
      }, callback);
    },
    popupLoginDialog: function() {
      chrome.runtime.sendMessage({
        ask: 'posting/popup_login',
        loginCallbackUrl: '../Message/new_embed_login_callback.html'
      });
    },
  }

  /**
   * Start the observation of the removal of Privly URL in editableElement.
   * If Privly URL is removed, we should close the Posting dialog.
   */
  function beginCloseObserve() {
    if (beginCloseObserve.intervalId) {
      return;
    }
    beginCloseObserve.intervalId = setInterval(function() {
      background.getTargetContent(function(content) {
        if (content === false || content.indexOf(privlyLink) === -1) {
          background.closeDialog();
        }
      });
    }, 1000);
  }

  function updateLink(callback) {
    // abort existing update progress
    if (lastUpdateXHR) {
      lastUpdateXHR.abort();
      lastUpdateXHR = null;
    }

    // doesn't allow user to manually trigger update
    $('.message-posting-dialog button').attr('disabled', 'disabled');
    $('.saving-text').show();

    // get PUT URL
    var dataURL =  privlyParameters.getParameterHash(privlyLink).privlyDataURL;

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
      function(response) {
        // re-enable controls
        $('.saving-text').hide();
        $('.message-posting-dialog button').removeAttr('disabled');
        lastUpdateXHR = null;
        callback && callback();
      },
      contentToPost);
  }

  function deleteLink(callback) {
    if (privlyLink == null) {
      return;
    }

    // when deleting link, we no longer allow users to trigger update
    $('.message-posting-dialog button').attr('disabled', 'disabled');

    var dataURL = privlyParameters.getParameterHash(privlyLink).privlyDataURL;
    
    privlyNetworkService.sameOriginDeleteRequest(
      dataURL,
      function(response) {
        if (response.jqXHR.status === 200) {
          callback && callback();
        }
      }, {});
  }

  function createLink(callback) {
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
      "format":"json"
    };

    // send
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts", 
      function(response) {
        callback && callback(processURL(response, randomkey));
      },
      contentToPost);
  }

  var loginCheckingCallback = {
    logined: function() {
      // retrive submit button information (show 'submit' or 'done')
      background.getFormInfo(function(info) {
        if (info.hasSubmitButton) {
          $('.btn-submit').show();
        } else {
          $('.btn-done').show();
        }
      });

      $('.login-check h3').text('Preparing your Privly link...');

      // 1. back up original content, in case of user cancel posting
      background.getTargetContent(function(content) {
        if (content === false) {
          background.closeDialog();
          return;
        }
        contentBeforeInsertion = content;

        // 2. create a link with empty content
        createLink(function(link) {
          privlyLink = link;

          // 3. insert link to the target
          background.insertLink(link, function(success) {
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

    notlogined: function() {
      $('.login-check').hide();
      $('.login-required').show();
    },

    error: function() {
      this.notlogined.call(this, arguments);
    }
  };

  function setup() {
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      loginCheckingCallback.logined.bind(loginCheckingCallback), 
      loginCheckingCallback.notlogined.bind(loginCheckingCallback), 
      loginCheckingCallback.error.bind(loginCheckingCallback)
    );

    $("[name='login']").click(function() {
      background.popupLoginDialog();
    });

    $("[name='cancel']").click(function() {
      deleteLink(function() {
        background.setTargetContent(contentBeforeInsertion);
        background.closeDialog();
      });
    });

    $("[name='done']").click(function() {
      updateLink(function() {
        background.closeDialog();
      });
    });

    $("[name='submit']").click(function() {
      updateLink(function() {
        background.triggerSubmit();
        background.closeDialog();
      });
    });

    $('textarea').keypress(function() {
      var onHitEnter = debounce(function(event) {
        updateLink(background.emitEnterEvent({
          ctrl: event.ctrlKey,
          alt: event.altKey,
          shift: event.shiftKey,
          meta: event.metaKey,
        }));
      }, 300);
      return function(ev) {
        if (ev.which === 13) {
          onHitEnter(ev);
        }
      }
    }());
  }

  document.addEventListener('DOMContentLoaded', setup);

}(window, document));