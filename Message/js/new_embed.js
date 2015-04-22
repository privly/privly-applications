(function(window, document, undefined) {

  var privlyLink = null;
  var privlyCipherKey = null;

  var lastUpdateXHR = null;

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

  function beginUpdating() {
    $('.message-posting-dialog button').attr('disabled', 'disabled');
    $('.saving-text').show();
  }

  function endUpdating() {
    $('.saving-text').hide();
    $('.message-posting-dialog button').removeAttr('disabled');
  }

  function updateLink(callback) {
    // abort existing update progress
    if (lastUpdateXHR) {
      lastUpdateXHR.abort();
      lastUpdateXHR = null;
    }

    // doesn't allow user to manually trigger update
    beginUpdating();

    // get PUT URL
    var state = {};
    state.parameters = privlyParameters.getParameterHash(privlyLink);
    state.jsonURL = state.parameters.privlyDataURL;

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
      state.jsonURL, 
      function(response) {
        lastUpdateXHR = null;
        endUpdating();
        callback && callback();
      },
      contentToPost);
  }

  function onHitEnter(event) {
    updateLink(function() {
      chrome.runtime.sendMessage({ask: 'posting/key_enter', keys: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }});
    });
  }

  onHitEnter = debounce(onHitEnter, 300);

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

  function insertLink(link) {
    privlyLink = link;
    chrome.runtime.sendMessage({ask: 'posting/insert_link', link: link});
  }

  var loginCheckingCallback = {
    logined: function() {
      // retrive submit button information (show 'submit' or 'done')
      chrome.runtime.sendMessage({
        ask: 'posting/ready'
      });

      $('.login-check h3').text('Preparing your Privly link...');

      // create a link with empty content
      createLink(insertLink);
    },

    notlogined: function() {
      $('.login-check').hide();
      $('.login-required').show();
    },

    error: function() {
      this.notlogined.call(this, arguments);
    },

    linkinserted: function() {
      $('.login-check').hide();
      $('.message-posting-dialog').show();
      $('textarea').focus();
    }
  };

  function setup() {
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      loginCheckingCallback.logined.bind(loginCheckingCallback), 
      loginCheckingCallback.notlogined.bind(loginCheckingCallback), 
      loginCheckingCallback.error.bind(loginCheckingCallback)
    );

    window.addEventListener('message', function(e) {
      var message = e.data;
      switch (e.data.type) {
        case 'submitButton':
          if (e.data.submit) {
            $('.btn-submit').show();
          } else {
            $('.btn-done').show();
          }
          break;
        case 'insertLinkDone':
          loginCheckingCallback.linkinserted();
          break;
      }
    });

    $("[name='login']").click(function() {
      chrome.runtime.sendMessage({
        ask: 'posting/popup_login',
        loginCallbackUrl: '../Message/new_embed_login_callback.html'
      });
    });

    $("[name='cancel']").click(function() {
      // TODO truly destroy message when cancel
      // TODO revert inserted link?
      chrome.runtime.sendMessage({ask: 'posting/close_post'});
    });

    $("[name='done']").click(function() {
      updateLink(function() {
        chrome.runtime.sendMessage({ask: 'posting/close_post'});
      });
    });

    $("[name='submit']").click(function() {
      updateLink(function() {
        chrome.runtime.sendMessage({ask: 'posting/submit'});
        chrome.runtime.sendMessage({ask: 'posting/close_post'});
      });
    });

    $('textarea').keypress(function(ev) {
      if (ev.which === 13) {
        onHitEnter(ev);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setup);

}(window, document));