/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/

/*global __html__, describe, beforeEach, afterEach, spyOn, jasmine, it, expect */
/*global chrome:true */
/*global privlyNetworkService */
/*global Privly, EmbededAdapter */

describe("Embeded Posting", function () {

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

  var adapter;

  /**
   * @todo remove HTML2JS hack
   * @see privly-application/pull/238
   */
  beforeEach(function () {
    var $login = $('<div>').addClass('login-required').hide().appendTo(document.body);
    $('<a>').attr('name', 'login').appendTo($login);
    $('<a>').attr('name', 'cancel').appendTo($login);
    var $dialog = $('<div>').addClass('embeded-form').hide().appendTo(document.body);
    $('<button>').attr('name', 'done').hide().appendTo($dialog);
    $('<button>').attr('name', 'submit').hide().appendTo($dialog);
    $('<button>').attr('name', 'cancel').appendTo($dialog);
    $('<select>').attr('id', 'seconds_until_burn').appendTo($dialog);
    $('<textarea>').appendTo($dialog);

    var app = new Privly.app.Plainpost();
    adapter = new Privly.adapter.Embeded(app);

    // Reset default values for each test case.
    mockValues = {
      chrome: {
        runtime: {
          sendMessage: {
            'embeded/getFormInfo': {
              hasSubmitButton: false
            },
            'embeded/getTargetContent': 'foo',
            'embeded/insertLink': true,
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

    spyOn(adapter, 'closeDialog').and.callThrough();
    spyOn(adapter, 'triggerSubmit').and.callThrough();
    spyOn(adapter, 'getTargetContent').and.callThrough();
    spyOn(adapter, 'setTargetContent').and.callThrough();
    spyOn(adapter, 'emitEnterEvent').and.callThrough();
    spyOn(adapter, 'getFormInfo').and.callThrough();
    spyOn(adapter, 'insertLink').and.callThrough();
    spyOn(adapter, 'popupLoginDialog').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'updateLink').and.callThrough();
    spyOn(adapter, 'deleteLink').and.callThrough();
    spyOn(adapter, 'switchToForm').and.callThrough();
    spyOn(adapter, 'switchToLogin').and.callThrough();

    adapter.init();
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  it("should send embeded/closePostDialog when #EmbededAdapter.closeDialog is called", function () {
    adapter.closeDialog();
    expect(chromeSentMessages['embeded/closePostDialog']).toBeDefined();
  });

  it("should send embeded/submit when #EmbededAdapter.triggerSubmit is called", function () {
    adapter.triggerSubmit();
    expect(chromeSentMessages['embeded/submit']).toBeDefined();
  });

  it("should send embeded/getTargetContent when #EmbededAdapter.getTargetContent is called", function () {
    adapter.getTargetContent();
    expect(chromeSentMessages['embeded/getTargetContent']).toBeDefined();
  });

  it("should return values from the response when #EmbededAdapter.getTargetContent is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = 'the magic content';
    adapter.getTargetContent(function (ret) {
      expect(ret).toBe('the magic content');
      done();
    });
  });

  it("should send embeded/setTargetContent when #EmbededAdapter.setTargetContent is called", function () {
    adapter.setTargetContent('another magic content');
    expect(chromeSentMessages['embeded/setTargetContent']).toBeDefined();
    expect(chromeSentMessages['embeded/setTargetContent'].content).toBe('another magic content');
  });

  it("should sent embeded/emitEnterEvent when #EmbededAdapter.emitEnterEvent is called", function () {
    adapter.emitEnterEvent({
      ctrl: true,
      meta: true,
    });
    expect(chromeSentMessages['embeded/emitEnterEvent']).toBeDefined();
    expect(chromeSentMessages['embeded/emitEnterEvent'].keys).toBeDefined();
    expect(chromeSentMessages['embeded/emitEnterEvent'].keys.ctrl).toBe(true);
    expect(chromeSentMessages['embeded/emitEnterEvent'].keys.meta).toBe(true);
    expect(chromeSentMessages['embeded/emitEnterEvent'].keys.alt).not.toBeDefined();
    expect(chromeSentMessages['embeded/emitEnterEvent'].keys.shift).not.toBeDefined();
  });

  it("should send embeded/getFormInfo when #EmbededAdapter.getFormInfo is called", function () {
    adapter.getFormInfo();
    expect(chromeSentMessages['embeded/getFormInfo']).toBeDefined();
  });

  it("should return values from the response when #EmbededAdapter.getFormInfo is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: false
    };
    adapter.getFormInfo(function (ret) {
      expect(ret.hasSubmitButton).toBe(false);
      expect(ret.submitButtonText).not.toBeDefined();
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.getFormInfo is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: true,
      submitButtonText: 'magic caption'
    };
    adapter.getFormInfo(function (ret) {
      expect(ret.hasSubmitButton).toBe(true);
      expect(ret.submitButtonText).toBe('magic caption');
      done();
    });
  });

  it("should send embeded/insertLink when #EmbededAdapter.insertLink is called", function () {
    adapter.insertLink(samplePrivlyLink);
    expect(chromeSentMessages['embeded/insertLink']).toBeDefined();
    expect(chromeSentMessages['embeded/insertLink'].link).toBe(samplePrivlyLink);
  });

  it("should return values from the response when #EmbededAdapter.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/insertLink'] = true;
    adapter.insertLink(samplePrivlyLink, function (ret) {
      expect(ret).toBe(true);
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/insertLink'] = false;
    adapter.insertLink(samplePrivlyLink, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it("should send embeded/popupLogin when #EmbededAdapter.popupLoginDialog is called", function () {
    adapter.popupLoginDialog();
    expect(chromeSentMessages['embeded/popupLogin']).toBeDefined();
    expect(chromeSentMessages['embeded/popupLogin'].loginCallbackUrl).toBeDefined();
  });

  it("should call privlyNetworkService.sameOriginPostRequest when #EmbededAdapter.createLink is called", function (done) {
    adapter.createLink(function () {
      expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled();
      done();
    });
  });

  it("should call privlyNetworkService.sameOriginPutRequest when #EmbededAdapter.updateLink is called", function (done) {
    adapter.createLink(function () {
      expect(privlyNetworkService.sameOriginPutRequest).not.toHaveBeenCalled();
      adapter.updateLink(function () {
        expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
        done();
      });
    });
  });

  it("should call privlyNetworkService.sameOriginDeleteRequest when #EmbededAdapter.deleteLink is called", function (done) {
    adapter.createLink(function () {
      expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
      adapter.deleteLink(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).toHaveBeenCalled();
        done();
      });
    });
  });

  it("should call #EmbededAdapter.popupLoginDialog when user clicks login", function () {
    $('[name="login"]').click();
    expect(adapter.popupLoginDialog).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when user clicks cancel", function () {
    $('[name="cancel"]').click();
    expect(adapter.closeDialog).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when user clicks done", function () {
    $('[name="done"]').click();
    expect(adapter.closeDialog).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when user clicks submit", function () {
    $('[name="submit"]').click();
    expect(adapter.closeDialog).toHaveBeenCalled();
  });

  it("should switch to form UI when user is logined", function () {
    privlyNetworkService.initPrivlyService = function (serverUrl, success, fail, error) {
      success();
    };
    adapter.start();
    expect(adapter.switchToForm).toHaveBeenCalled();
  });

  it("should switch to login UI when user is not logined", function () {
    privlyNetworkService.initPrivlyService = function (serverUrl, success, fail, error) {
      fail();
    };
    adapter.start();
    expect(adapter.switchToLogin).toHaveBeenCalled();
  });

  it("should switch to login UI when there is an error checking connection", function () {
    privlyNetworkService.initPrivlyService = function (serverUrl, success, fail, error) {
      error();
    };
    adapter.start();
    expect(adapter.switchToLogin).toHaveBeenCalled();
  });

  it("should show the done button when there isn't any submit button", function () {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: false
    };
    adapter.switchToForm();
    expect($('button[name="submit"]').is(':visible')).toBe(false);
    expect($('button[name="done"]').is(':visible')).toBe(true);
  });

  it("should show the submit button with proper text when there is a submit button", function () {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: true,
      submitButtonText: '[SUBMIT]'
    };
    adapter.switchToForm();
    expect($('button[name="submit"]').is(':visible')).toBe(true);
    expect($('button[name="submit"]').text()).toBe('[SUBMIT]');
    expect($('button[name="done"]').is(':visible')).toBe(false);
  });

  it("should treat submit button text as plaintext", function () {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: true,
      submitButtonText: '<b>Hello</b>'
    };
    adapter.switchToForm();
    expect($('button[name="submit"]').text()).toBe('<b>Hello</b>');
  });

  it("should call #EmbededAdapter.closeDialog when it cannot get the content of editable element", function () {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = false;
    adapter.switchToForm();
    expect(adapter.closeDialog).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.insertLink to insert the link when switching to form UI", function () {
    adapter.switchToForm();
    expect(adapter.insertLink).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Function));
  });

  it("should call #EmbededAdapter.updateLink when user pressed ENTER in form UI", function (done) {
    adapter.switchToForm();
    var e = $.Event('keydown');
    e.which = 13;
    $('textarea').trigger(e);
    setTimeout(function () {
      expect(adapter.updateLink).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should call #EmbededAdapter.updateLink only once when user pressed ENTER multiple times", function (done) {
    adapter.switchToForm();
    var i, e;
    for (i = 0; i < 10; ++i) {
      e = $.Event('keydown');
      e.which = 13;
      $('textarea').trigger(e);
    }
    setTimeout(function () {
      expect(adapter.updateLink.calls.count()).toEqual(1);
      done();
    }, 500);
  });

  it("should call #EmbededAdapter.updateLink when user changes seconds_until_burn", function () {
    adapter.switchToForm();
    $('#seconds_until_burn').change();
    expect(adapter.updateLink).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.deleteLink when user clicks cancel", function () {
    adapter.switchToForm();
    $('button[name="cancel"]').click();
    expect(adapter.deleteLink).toHaveBeenCalled();
  });

  it("should not send request to destroy the link when user cancels in login UI", function () {
    adapter.switchToLogin();
    $('a[name="cancel"]').click();
    expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.setTargetContent to reset the content of the editable element when user clicks cancel", function () {
    var originalContent = mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'];
    adapter.switchToForm();
    $('button[name="cancel"]').click();
    expect(adapter.setTargetContent).toHaveBeenCalled();
    expect(chromeSentMessages['embeded/setTargetContent'].content).toEqual(originalContent);
  });

  it("should call #EmbededAdapter.setTargetContent to reset the content of the editable element when user clicks cancel", function () {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = '';
    adapter.switchToForm();
    $('button[name="cancel"]').click();
    expect(adapter.setTargetContent).toHaveBeenCalled();
    expect(chromeSentMessages['embeded/setTargetContent'].content).toEqual('');
  });

});
