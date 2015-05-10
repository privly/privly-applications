/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/

/*global __html__, describe, beforeEach, afterEach, spyOn, jasmine, it, expect */
/*global chrome:true, mockValues:true, chromeSentMessages: true */
/*global privlyNetworkService, loginCheckingCallback, attachEventHandlers, resetGlobals */

describe("Embed Posting Application", function () {

  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function () {
    var keys = Object.keys(__html__);
    var selectKey;
    keys.forEach(function (key) {
      if (key.indexOf("Message/new_embed.html") >= 0) {
        selectKey = key;
      }
    });
    document.body.innerHTML = __html__[selectKey];

    // Pre-define some mock callback values for Chrome background scripts.
    // Can be overwritten in test cases.
    mockValues = {
      chrome: {
        runtime: {
          sendMessage: {
            'posting/get_form_info': {
              hasSubmitButton: false
            },
            'posting/get_target_content': 'foo',
            'posting/insert_link': true,
          }
        }
      },
      privlyNetworkService: {
        sameOriginPostRequest: {
          jqXHR: {
            getResponseHeader: {
              'X-Privly-Url': 'https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1122334455&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F1234.json%3Frandom_token%3D1122334455'
            }
          }
        }
      }
    };

    // Used to identify whether specific message was sent.
    // We cannot use spyOn function of jasmine here because
    // it cannot deal with multiple calls situation.
    chromeSentMessages = {};

    // mock chrome APIs
    chrome = {
      runtime: {
        sendMessage: function (msg, callback) {
          // we simply mark it sent
          chromeSentMessages[msg.ask] = msg;
          if (mockValues.chrome.runtime.sendMessage.hasOwnProperty(msg.ask)) {
            callback && callback(mockValues.chrome.runtime.sendMessage[msg.ask]);
          }
        }
      }
    };

    // mock Privly APIs
    privlyNetworkService.sameOriginPostRequest = function (url, callback, content) {
      callback && callback({
        jqXHR: {
          status: 201,
          getResponseHeader: function (key) {
            if (mockValues.privlyNetworkService.sameOriginPostRequest.jqXHR.getResponseHeader.hasOwnProperty(key)) {
              return mockValues.privlyNetworkService.sameOriginPostRequest.jqXHR.getResponseHeader[key];
            }
          }
        }
      });
    };

    privlyNetworkService.sameOriginPutRequest = function (url, callback, content) {
      callback && callback({
        jqXHR: {}
      });
    };

    privlyNetworkService.sameOriginDeleteRequest = function (url, callback, content) {
      callback && callback({
        jqXHR: {}
      });
    };

    spyOn(privlyNetworkService, 'sameOriginPostRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginPutRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginDeleteRequest').and.callThrough();

    resetGlobals();
    attachEventHandlers();
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  it("should show the login link when the user is not logined", function () {
    loginCheckingCallback.notlogined();
    expect($('[name="login"]').is(':visible')).toBe(true);
  });

  it("should send message to pop up login dialog when user clicks login", function () {
    $('[name="login"]').click();
    expect(chromeSentMessages['posting/popup_login']).toBeDefined();
  });

  it("should send message to destroy iframe when user clicks cancel", function () {
    $('[name="cancel"]').click();
    expect(chromeSentMessages['posting/close_post_dialog']).toBeDefined();
  });

  it("should send message to destroy iframe when user clicks done", function () {
    $('[name="done"]').click();
    expect(chromeSentMessages['posting/close_post_dialog']).toBeDefined();
  });

  it("should send message to destroy iframe when user clicks submit", function () {
    $('[name="submit"]').click();
    expect(chromeSentMessages['posting/close_post_dialog']).toBeDefined();
  });

  it("should show posting message form when the user is logined", function () {
    loginCheckingCallback.logined();
    expect($('textarea').is(':visible')).toBe(true);
    expect($('.btn-cancel').is(':visible')).toBe(true);
  });

  it("should show the done button when there isn't any submit button", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_form_info'] = {
      hasSubmitButton: false
    };
    loginCheckingCallback.logined();
    expect($('[name="submit"]').is(':visible')).toBe(false);
    expect($('[name="done"]').is(':visible')).toBe(true);
  });

  it("should show the submit button with proper text when there is a submit button", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_form_info'] = {
      hasSubmitButton: true,
      submitButtonText: '[SUBMIT]'
    };
    loginCheckingCallback.logined();
    expect($('[name="submit"]').is(':visible')).toBe(true);
    expect($('[name="submit"]').text()).toBe('[SUBMIT]');
    expect($('[name="done"]').is(':visible')).toBe(false);
  });

  it("should treat submit button text as plaintext", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_form_info'] = {
      hasSubmitButton: true,
      submitButtonText: '<b>Hello</b>'
    };
    loginCheckingCallback.logined();
    expect($('[name="submit"]').text()).toBe('<b>Hello</b>');
  });

  it("should send message to destroy iframe when it cannot get the content of editable element", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_target_content'] = false;
    loginCheckingCallback.logined();
    expect(chromeSentMessages['posting/close_post_dialog']).toBeDefined();
  });

  it("should send message to insert the link", function () {
    loginCheckingCallback.logined();
    var url = mockValues.privlyNetworkService.sameOriginPostRequest.jqXHR.getResponseHeader['X-Privly-Url'];
    expect(chromeSentMessages['posting/insert_link'].link).toContain(url);
  });

  it("should update the link when user pressed ENTER", function (done) {
    loginCheckingCallback.logined();
    var e = $.Event('keydown');
    e.which = 13;
    $('textarea').trigger(e);
    setTimeout(function () {
      expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should update the link only once when user pressed ENTER multiple times", function (done) {
    loginCheckingCallback.logined();
    var i, e;
    for (i = 0; i < 10; ++i) {
      e = $.Event('keydown');
      e.which = 13;
      $('textarea').trigger(e);
    }
    setTimeout(function () {
      expect(privlyNetworkService.sameOriginPutRequest.calls.count()).toEqual(1);
      done();
    }, 500);
  });

  it("should update the link when user changes seconds_until_burn", function () {
    loginCheckingCallback.logined();
    $('#seconds_until_burn').change();
    expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
  });

  it("should destroy the link when user clicks cancel", function () {
    loginCheckingCallback.logined();
    $('[name="cancel"]').click();
    expect(privlyNetworkService.sameOriginDeleteRequest).toHaveBeenCalled();
  });

  it("should not send request to destroy the link when user is not logined", function () {
    loginCheckingCallback.notlogined();
    $('[name="cancel"]').click();
    expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
  });

  it("should send message to reset the content of the editable element when user clicks cancel", function () {
    var originalContent = mockValues.chrome.runtime.sendMessage['posting/get_target_content'];
    loginCheckingCallback.logined();
    $('.btn-cancel').click();
    expect(chromeSentMessages['posting/set_target_content'].content).toEqual(originalContent);
  });

});
