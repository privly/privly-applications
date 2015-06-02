/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 **/

/*global describe, beforeEach, afterEach, spyOn, jasmine, it, expect */
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
    spyOn(adapter, 'onLoginClick').and.callThrough();
    spyOn(adapter, 'onCancelClick').and.callThrough();
    spyOn(adapter, 'onDoneClick').and.callThrough();
    spyOn(adapter, 'onSubmitClick').and.callThrough();
    spyOn(adapter, 'onTTLChange').and.callThrough();
    spyOn(adapter, 'onEnterHit').and.callThrough();

    adapter.init();
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  it("should send embeded/closePostDialog when #EmbededAdapter.closeDialog is called", function (done) {
    adapter.closeDialog().then(function () {
      expect(chromeSentMessages['embeded/closePostDialog']).toBeDefined();
      done();
    });
  });

  it("should send embeded/submit when #EmbededAdapter.triggerSubmit is called", function (done) {
    adapter.triggerSubmit().then(function () {
      expect(chromeSentMessages['embeded/submit']).toBeDefined();
      done();
    });
  });

  it("should send embeded/getTargetContent when #EmbededAdapter.getTargetContent is called", function (done) {
    adapter.getTargetContent().then(function () {
      expect(chromeSentMessages['embeded/getTargetContent']).toBeDefined();
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.getTargetContent is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = 'the magic content';
    adapter.getTargetContent().then(function (ret) {
      expect(ret).toBe('the magic content');
      done();
    });
  });

  it("should send embeded/setTargetContent when #EmbededAdapter.setTargetContent is called", function (done) {
    adapter.setTargetContent('another magic content').then(function (ret) {
      expect(chromeSentMessages['embeded/setTargetContent']).toBeDefined();
      expect(chromeSentMessages['embeded/setTargetContent'].content).toBe('another magic content');
      done();
    });
  });

  it("should sent embeded/emitEnterEvent when #EmbededAdapter.emitEnterEvent is called", function (done) {
    adapter.emitEnterEvent({
      ctrl: true,
      meta: true,
    }).then(function () {
      expect(chromeSentMessages['embeded/emitEnterEvent']).toBeDefined();
      expect(chromeSentMessages['embeded/emitEnterEvent'].keys).toBeDefined();
      expect(chromeSentMessages['embeded/emitEnterEvent'].keys.ctrl).toBe(true);
      expect(chromeSentMessages['embeded/emitEnterEvent'].keys.meta).toBe(true);
      expect(chromeSentMessages['embeded/emitEnterEvent'].keys.alt).not.toBeDefined();
      expect(chromeSentMessages['embeded/emitEnterEvent'].keys.shift).not.toBeDefined();
      done();
    });
  });

  it("should send embeded/getFormInfo when #EmbededAdapter.getFormInfo is called", function (done) {
    adapter.getFormInfo().then(function () {
      expect(chromeSentMessages['embeded/getFormInfo']).toBeDefined();
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.getFormInfo is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: false
    };
    adapter.getFormInfo().then(function (ret) {
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
    adapter.getFormInfo().then(function (ret) {
      expect(ret.hasSubmitButton).toBe(true);
      expect(ret.submitButtonText).toBe('magic caption');
      done();
    });
  });

  it("should send embeded/insertLink when #EmbededAdapter.insertLink is called", function (done) {
    adapter.insertLink(samplePrivlyLink).then(function() {
      expect(chromeSentMessages['embeded/insertLink']).toBeDefined();
      expect(chromeSentMessages['embeded/insertLink'].link).toBe(samplePrivlyLink);
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/insertLink'] = true;
    adapter.insertLink(samplePrivlyLink).then(function (ret) {
      expect(ret).toBe(true);
      done();
    });
  });

  it("should return values from the response when #EmbededAdapter.insertLink is called", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/insertLink'] = false;
    adapter.insertLink(samplePrivlyLink).then(function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it("should send embeded/popupLogin when #EmbededAdapter.popupLoginDialog is called", function (done) {
    adapter.popupLoginDialog().then(function () {
      expect(chromeSentMessages['embeded/popupLogin']).toBeDefined();
      expect(chromeSentMessages['embeded/popupLogin'].loginCallbackUrl).toBeDefined();
      done();
    });
  });

  it("should call privlyNetworkService.sameOriginPostRequest when #EmbededAdapter.createLink is called", function (done) {
    adapter.createLink().then(function () {
      expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled();
      done();
    });
  });

  it("should call privlyNetworkService.sameOriginPutRequest when #EmbededAdapter.updateLink is called", function (done) {
    adapter.createLink()
      .then(function () {
        expect(privlyNetworkService.sameOriginPutRequest).not.toHaveBeenCalled();
      })
      .then(adapter.updateLink.bind(adapter))
      .then(function () {
        expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
        done();
      });
  });

  it("should call privlyNetworkService.sameOriginDeleteRequest when #EmbededAdapter.deleteLink is called", function (done) {
    adapter.createLink()
      .then(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
      })
      .then(adapter.deleteLink.bind(adapter))
      .then(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).toHaveBeenCalled();
        done();
      });
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

  it("should call #EmbededAdapter.popupLoginDialog when #EmbededAdapter.onLoginClick is called", function (done) {
    adapter.onLoginClick().then(function () {
      expect(adapter.popupLoginDialog).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.onLoginClick when user clicks login", function () {
    $('[name="login"]').click();
    expect(adapter.onLoginClick).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when #EmbededAdapter.onCancelClick is called", function (done) {
    adapter.onCancelClick().then(function () {
      expect(adapter.closeDialog).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.onCancelClick when user clicks cancel", function () {
    $('[name="cancel"]').click();
    expect(adapter.onCancelClick).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when #EmbededAdapter.onDoneClick is called", function (done) {
    adapter.onDoneClick().then(function () {
      expect(adapter.closeDialog).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.onDoneClick when user clicks done", function () {
    $('[name="done"]').click();
    expect(adapter.onDoneClick).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.closeDialog when #EmbededAdapter.onSubmitClick is called", function (done) {
    adapter.onSubmitClick().then(function () {
      expect(adapter.closeDialog).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.onSubmitClick when user clicks submit", function () {
    $('[name="submit"]').click();
    expect(adapter.onSubmitClick).toHaveBeenCalled();
  });

  it("should call #EmbededAdapter.updateLink when #EmbededAdapter.onTTLChange is called", function (done) {
    adapter.onTTLChange().then(function () {
      expect(adapter.updateLink).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.onTTLChange when user changes the seconds_until_burn select control", function () {
    $('#seconds_until_burn').change();
    expect(adapter.onTTLChange).toHaveBeenCalled();
  });

  it("should show the done button when there isn't any submit button", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: false
    };
    adapter.switchToForm().then(function () {
      expect($('button[name="submit"]').is(':visible')).toBe(false);
      expect($('button[name="done"]').is(':visible')).toBe(true);
      done();
    });
  });

  it("should show the submit button with proper text when there is a submit button", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: true,
      submitButtonText: '[SUBMIT]'
    };
    adapter.switchToForm().then(function () {
      expect($('button[name="submit"]').is(':visible')).toBe(true);
      expect($('button[name="submit"]').text()).toBe('[SUBMIT]');
      expect($('button[name="done"]').is(':visible')).toBe(false);
      done();
    });
  });

  it("should treat submit button text as plaintext", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getFormInfo'] = {
      hasSubmitButton: true,
      submitButtonText: '<b>Hello</b>'
    };
    adapter.switchToForm().then(function () {
      expect($('button[name="submit"]').text()).toBe('<b>Hello</b>');
      done();
    });
  });

  it("should call #EmbededAdapter.closeDialog when it cannot get the content of editable element", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = false;
    adapter.switchToForm().then(null, function () {
      expect(adapter.closeDialog).toHaveBeenCalled();
      done();
    });
  });

  it("should call #EmbededAdapter.insertLink to insert the link when switching to form UI", function (done) {
    adapter.switchToForm().then(function () {
      expect(adapter.insertLink).toHaveBeenCalledWith(jasmine.any(String));
      done();
    });
  });

  it("should call #EmbededAdapter.updateLink when user pressed ENTER in form UI", function (done) {
    adapter.switchToForm().then(function () {
      var e = $.Event('keydown');
      e.which = 13;
      $('textarea').trigger(e);
      setTimeout(function () {
        expect(adapter.updateLink).toHaveBeenCalled();
        done();
      }, 500);
    });
  });

  it("should call #EmbededAdapter.updateLink only once when user pressed ENTER multiple times", function (done) {
    adapter.switchToForm().then(function () {
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
  });

  it("should call #EmbededAdapter.deleteLink when user clicks cancel in form UI", function (done) {
    adapter
      .switchToForm()
      .then(adapter.onCancelClick.bind(adapter))
      .then(function () {
        expect(adapter.deleteLink).toHaveBeenCalled();
        done();
      });
  });

  it("should not send request to destroy the link when user cancels in login UI", function (done) {
    adapter
      .switchToLogin()
      .then(adapter.onCancelClick.bind(adapter))
      .then(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
        done();
      });
  });

  it("should call #EmbededAdapter.setTargetContent to reset the content of the editable element when user clicks cancel", function (done) {
    var originalContent = mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'];
    adapter
      .switchToForm()
      .then(adapter.onCancelClick.bind(adapter))
      .then(function () {
        expect(adapter.setTargetContent).toHaveBeenCalled();
        expect(chromeSentMessages['embeded/setTargetContent'].content).toEqual(originalContent);
        done();
      });
  });

  it("should call #EmbededAdapter.setTargetContent to reset the content of the editable element when user clicks cancel", function (done) {
    mockValues.chrome.runtime.sendMessage['embeded/getTargetContent'] = '';
    adapter
      .switchToForm()
      .then(adapter.onCancelClick.bind(adapter))
      .then(function () {
        expect(adapter.setTargetContent).toHaveBeenCalled();
        expect(chromeSentMessages['embeded/setTargetContent'].content).toEqual('');
        done();
      });
  });

});
