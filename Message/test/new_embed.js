/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/

/*global __html__, describe, beforeEach, afterEach, spyOn, jasmine, it, expect */
/*global chrome:true */
/*global privlyNetworkService */
/*global background, privlyWeb, loginCheckingCallback, attachEventHandlers, resetGlobals */

describe("Embed Posting Application", function () {

  var samplePrivlyLink = 'https://privlyalpha.org/apps/Message/show?privlyApp=Message&privlyInject1=true&random_token=1122334455&privlyDataURL=https%3A%2F%2Fprivlyalpha.org%2Fposts%2F1234.json%3Frandom_token%3D1122334455';

  /**
   * Pre-define some mock callback values for Chrome background scripts.
   * Can be overwritten in each test cases.
   * 
   * @type {Object}
   */
  var mockValues = {};

  /**
   * Used to identify whether specific message was sent.
   * Sometimes we cannot use the spyOn function of jasmine
   * because it cannot deal with multiple calls situation.
   * 
   * @type {Object}
   */
  var chromeSentMessages = {};

  /**
   * @todo remove HTML2JS hack
   * @see privly-application/pull/238
   */
  beforeEach(function () {
    var keys = Object.keys(__html__);
    var selectKey;
    keys.forEach(function (key) {
      if (key.indexOf("Message/new_embed.html") >= 0) {
        selectKey = key;
      }
    });
    document.body.innerHTML = __html__[selectKey];

    // Reset default values for each test case.
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
              'X-Privly-Url': samplePrivlyLink
            }
          }
        }
      }
    };
    chromeSentMessages = {};

    /**
     * mock Chrome API calls
     * 
     * @type {Object}
     */
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

    // mock Privly network service API calls
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

    // Spy on Privly network service API
    spyOn(privlyNetworkService, 'sameOriginPostRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginPutRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginDeleteRequest').and.callThrough();

    // Spy on background.* calls
    spyOn(background, 'closeDialog').and.callThrough();
    spyOn(background, 'triggerSubmit').and.callThrough();
    spyOn(background, 'getTargetContent').and.callThrough();
    spyOn(background, 'setTargetContent').and.callThrough();
    spyOn(background, 'emitEnterEvent').and.callThrough();
    spyOn(background, 'getFormInfo').and.callThrough();
    spyOn(background, 'insertLink').and.callThrough();
    spyOn(background, 'popupLoginDialog').and.callThrough();

    // Spy on privlyWeb.* calls
    spyOn(privlyWeb, 'createLink').and.callThrough();
    spyOn(privlyWeb, 'updateLink').and.callThrough();
    spyOn(privlyWeb, 'deleteLink').and.callThrough();

    // We should reset variables in new_embed.js in each test
    // TODO: better approaches?
    resetGlobals();
    attachEventHandlers();
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  it("should send posting/close_post_dialog when background.closeDialog is called", function () {
    background.closeDialog();
    expect(chromeSentMessages['posting/close_post_dialog']).toBeDefined();
  });

  it("should send posting/submit when background.triggerSubmit is called", function () {
    background.triggerSubmit();
    expect(chromeSentMessages['posting/submit']).toBeDefined();
  });

  it("should send posting/get_target_content when background.getTargetContent is called", function () {
    background.getTargetContent();
    expect(chromeSentMessages['posting/get_target_content']).toBeDefined();
  });

  it("should return values from the response when background.getTargetContent is called", function (done) {
    mockValues.chrome.runtime.sendMessage['posting/get_target_content'] = 'the magic content';
    background.getTargetContent(function (ret) {
      expect(ret).toBe('the magic content');
      done();
    });
  });

  it("should send posting/set_target_content when background.setTargetContent is called", function () {
    background.setTargetContent('another magic content');
    expect(chromeSentMessages['posting/set_target_content']).toBeDefined();
    expect(chromeSentMessages['posting/set_target_content'].content).toBe('another magic content');
  });

  it("should sent posting/on_keydown_enter when background.emitEnterEvent is called", function () {
    background.emitEnterEvent({
      ctrl: true,
      meta: true,
    });
    expect(chromeSentMessages['posting/on_keydown_enter']).toBeDefined();
    expect(chromeSentMessages['posting/on_keydown_enter'].keys).toBeDefined();
    expect(chromeSentMessages['posting/on_keydown_enter'].keys.ctrl).toBe(true);
    expect(chromeSentMessages['posting/on_keydown_enter'].keys.meta).toBe(true);
    expect(chromeSentMessages['posting/on_keydown_enter'].keys.alt).not.toBeDefined();
    expect(chromeSentMessages['posting/on_keydown_enter'].keys.shift).not.toBeDefined();
  });

  it("should send posting/get_form_info when background.getFormInfo is called", function () {
    background.getFormInfo();
    expect(chromeSentMessages['posting/get_form_info']).toBeDefined();
  });

  it("should return values from the response when background.getFormInfo is called", function (done) {
    mockValues.chrome.runtime.sendMessage['posting/get_form_info'] = {
      hasSubmitButton: false
    };
    background.getFormInfo(function (ret) {
      expect(ret.hasSubmitButton).toBe(false);
      expect(ret.submitButtonText).not.toBeDefined();
      done();
    });
  });

  it("should return values from the response when background.getFormInfo is called", function (done) {
    mockValues.chrome.runtime.sendMessage['posting/get_form_info'] = {
      hasSubmitButton: true,
      submitButtonText: 'magic caption'
    };
    background.getFormInfo(function (ret) {
      expect(ret.hasSubmitButton).toBe(true);
      expect(ret.submitButtonText).toBe('magic caption');
      done();
    });
  });

  it("should send posting/insert_link when background.insertLink is called", function () {
    background.insertLink(samplePrivlyLink);
    expect(chromeSentMessages['posting/insert_link']).toBeDefined();
    expect(chromeSentMessages['posting/insert_link'].link).toBe(samplePrivlyLink);
  });

  it("should return values from the response when background.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['posting/insert_link'] = true;
    background.insertLink(samplePrivlyLink, function (ret) {
      expect(ret).toBe(true);
      done();
    });
  });

  it("should return values from the response when background.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['posting/insert_link'] = false;
    background.insertLink(samplePrivlyLink, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it("should send posting/popup_login when background.popupLoginDialog is called", function () {
    background.popupLoginDialog();
    expect(chromeSentMessages['posting/popup_login']).toBeDefined();
    expect(chromeSentMessages['posting/popup_login'].loginCallbackUrl).toBeDefined();
  });

  it("should call privlyNetworkService.sameOriginPostRequest when privlyWeb.createLink is called", function (done) {
    privlyWeb.createLink(function () {
      expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled();
      done();
    });
  });

  it("should call privlyNetworkService.sameOriginPutRequest when privlyWeb.updateLink is called", function (done) {
    privlyWeb.createLink(function () {
      expect(privlyNetworkService.sameOriginPutRequest).not.toHaveBeenCalled();
      privlyWeb.updateLink(function () {
        expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
        done();
      });
    });
  });

  it("should call privlyNetworkService.sameOriginDeleteRequest when privlyWeb.deleteLink is called", function (done) {
    privlyWeb.createLink(function () {
      expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
      privlyWeb.deleteLink(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).toHaveBeenCalled();
        done();
      });
    });
  });

  it("should show the login link when the user is not logined", function () {
    loginCheckingCallback.notlogined();
    expect($('[name="login"]').is(':visible')).toBe(true);
  });

  it("should call background.popupLoginDialog when user clicks login", function () {
    $('[name="login"]').click();
    expect(background.popupLoginDialog).toHaveBeenCalled();
  });

  it("should call background.closeDialog when user clicks cancel", function () {
    $('[name="cancel"]').click();
    expect(background.closeDialog).toHaveBeenCalled();
  });

  it("should call background.closeDialog when user clicks done", function () {
    $('[name="done"]').click();
    expect(background.closeDialog).toHaveBeenCalled();
  });

  it("should call background.closeDialog when user clicks submit", function () {
    $('[name="submit"]').click();
    expect(background.closeDialog).toHaveBeenCalled();
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

  it("should call background.closeDialog when it cannot get the content of editable element", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_target_content'] = false;
    loginCheckingCallback.logined();
    expect(background.closeDialog).toHaveBeenCalled();
  });

  it("should call background.insertLink to insert the link when logined", function () {
    loginCheckingCallback.logined();
    var url = mockValues.privlyNetworkService.sameOriginPostRequest.jqXHR.getResponseHeader['X-Privly-Url'];
    expect(background.insertLink).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Function));
  });

  it("should call privlyWeb.updateLink when user pressed ENTER", function (done) {
    loginCheckingCallback.logined();
    var e = $.Event('keydown');
    e.which = 13;
    $('textarea').trigger(e);
    setTimeout(function () {
      expect(privlyWeb.updateLink).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should call privlyWeb.updateLink only once when user pressed ENTER multiple times", function (done) {
    loginCheckingCallback.logined();
    var i, e;
    for (i = 0; i < 10; ++i) {
      e = $.Event('keydown');
      e.which = 13;
      $('textarea').trigger(e);
    }
    setTimeout(function () {
      expect(privlyWeb.updateLink.calls.count()).toEqual(1);
      done();
    }, 500);
  });

  it("should call privlyWeb.updateLink when user changes seconds_until_burn", function () {
    loginCheckingCallback.logined();
    $('#seconds_until_burn').change();
    expect(privlyWeb.updateLink).toHaveBeenCalled();
  });

  it("should call privlyWeb.deleteLink when user clicks cancel", function () {
    loginCheckingCallback.logined();
    $('[name="cancel"]').click();
    expect(privlyWeb.deleteLink).toHaveBeenCalled();
  });

  it("should not send request to destroy the link when user is not logined", function () {
    loginCheckingCallback.notlogined();
    $('[name="cancel"]').click();
    expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
  });

  it("should call background.setTargetContent to reset the content of the editable element when user clicks cancel", function () {
    var originalContent = mockValues.chrome.runtime.sendMessage['posting/get_target_content'];
    loginCheckingCallback.logined();
    $('.btn-cancel').click();
    expect(background.setTargetContent).toHaveBeenCalled();
    expect(chromeSentMessages['posting/set_target_content'].content).toEqual(originalContent);
  });

  it("should call background.setTargetContent to reset the content of the editable element when user clicks cancel", function () {
    mockValues.chrome.runtime.sendMessage['posting/get_target_content'] = '';
    loginCheckingCallback.logined();
    $('.btn-cancel').click();
    expect(background.setTargetContent).toHaveBeenCalled();
    expect(chromeSentMessages['posting/set_target_content'].content).toEqual('');
  });

});
