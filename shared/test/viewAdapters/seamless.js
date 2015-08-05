/**
 * @fileOverview `seamless` view adapter test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/*global Privly, Promise, privlyNetworkService */
describe('Privly.app.viewAdapter.Seamless', function () {

  var msgSent;
  var requestJson;

  var testPrivlyUrl = 'http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1=true&random_token=67782720ce&privlyDataURL=http%3A%2F%2Flocalhost%3A3000%2Fposts%2F468.json%3Frandom_token%3D67782720ce';
  var testDataUrl = 'http://localhost:3000/posts/468.json?random_token=67782720ce';
  var testDestroyedUrl = 'http://localhost:3000/posts/469.json?random_token=67782720ce';
  var testJson = {};  // will be reset before each test
  var testApp = null; // will be reset before each test

  beforeEach(function () {
    msgSent = [];
    Privly.message.messageExtension = function (msg, hasResponse) {
      msgSent.push(msg);
      return Promise.resolve();
    };
    spyOn(Privly.message, 'messageExtension').and.callThrough();
    document.body.innerHTML = '<textarea>hello</textarea>';

    // reset mock data
    testApp = new Privly.app.model.Plainpost();
    testJson = {
      "burn_after_date": "2015-08-25T01:55:46Z",
      "content": "123",
      "created_at": "2015-07-28T01:55:46Z",
      "id": 468,
      "privly_application": "PlainPost",
      "public": true,
      "random_token": "67782720ce",
      "structured_content": "",
      "updated_at": "2015-07-28T01:55:46Z",
      "user_id": 1,
      "rendered_markdown": "<p>123</p>\n",
      "X-Privly-Url": "http://localhost:3000/apps/PlainPost/show?privlyApp=PlainPost&privlyInject1…tp%3A%2F%2Flocalhost%3A3000%2Fposts%2F468.json%3Frandom_token%3D67782720ce",
      "permissions": {
        "canshow": true,
        "canupdate": true,
        "candestroy": true,
        "canshare": true
      }
    };

    // mock network services
    privlyNetworkService.contentServerDomain = function () {
      return 'http://localhost:3000';
    };
    privlyNetworkService.sameOriginGetRequest = function (url, callback) {
      if (url === testDataUrl) {
        callback({
          json: testJson,
          jqXHR: {
            status: 200
          }
        });
      } else if (url === testDestroyedUrl) {
        callback({
          json: {
            "error": "You do not have access or it doesn't exist."
          },
          jqXHR: {
            status: 403
          }
        });
      } else {
        callback({
          json: null,
          jqXHR: {
            status: 404
          }
        });
      }
    };
    privlyNetworkService.sameOriginPostRequest = function (url, callback, data) {
      if (url === 'http://localhost:3000/posts') {
        requestJson = JSON.parse(JSON.stringify(testJson));
        // seconds_until_burn are omitted here
        requestJson.content = data.post.content;
        requestJson.structured_content = data.post.structured_content;
        requestJson.privly_application = data.post.privly_application;
        requestJson.public = data.post.public;
        callback({
          json: requestJson,
          jqXHR: {
            status: 201, // created
            getResponseHeader: function (header) {
              if (header.toLowerCase() === 'x-privly-url') {
                return testPrivlyUrl;
              }
            }
          }
        });
      } else {
        callback({
          json: {},
          jqXHR: {
            status: 404
          }
        });
      }
    };
    privlyNetworkService.sameOriginPutRequest = function (url, callback, data) {
      if (url.indexOf('http://localhost:3000/posts') === 0) {
        requestJson = JSON.parse(JSON.stringify(testJson));
        requestJson.content = data.post.content;
        callback({
          json: requestJson,
          jqXHR: {
            status: 200
          }
        });
      } else {
        callback({
          json: {},
          jqXHR: {
            status: 404
          }
        });
      }
    };
    privlyNetworkService.sameOriginDeleteRequest = function (url, callback, data) {
      callback({
        json: {},
        jqXHR: {
          status: 200
        }
      });
    };
    spyOn(privlyNetworkService, 'sameOriginGetRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginPostRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginPutRequest').and.callThrough();
    spyOn(privlyNetworkService, 'sameOriginDeleteRequest').and.callThrough();
  });

  afterEach(function () {
    document.body.innerHTML = '';
  });

  it('debounce works', function (done) {
    var counter = 0;
    var foo = function () { counter++; };
    var debouncedFoo = Privly.app.viewAdapter.Seamless.debounce(foo, 50);
    debouncedFoo();
    debouncedFoo();
    setTimeout(function () {
      debouncedFoo();
    }, 20);
    setTimeout(function () {
      expect(counter).toBe(1);
      done();
    }, 100);
  });

  it('msgTextareaFocused calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgTextareaFocused();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/textareaFocused');
  });

  it('msgTextareaBlurred calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgTextareaBlurred();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/textareaBlurred');
  });

  it('msgStartLoading calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgStartLoading();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/loading');
    expect(msgSent[0].state).toBe(true);
  });

  it('msgStopLoading calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgStopLoading();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/loading');
    expect(msgSent[0].state).toBe(false);
  });

  it('msgGetTargetContent calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgGetTargetContent();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/getTargetContent');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgGetTargetText calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgGetTargetText();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/getTargetText');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgSetTargetText calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgSetTargetText('abc');
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/setTargetText');
    expect(msgSent[0].text).toBe('abc');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgInsertLink calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgInsertLink('http://privlyalpha.com/123');
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/insertLink');
    expect(msgSent[0].link).toBe('http://privlyalpha.com/123');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgEmitEnterEvent calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgEmitEnterEvent({
      meta: true,
      shift: true
    });
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/emitEnterEvent');
    expect(msgSent[0].keys).toEqual({
      meta: true,
      shift: true
    });
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgPopupLoginDialog calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgPopupLoginDialog();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/background/popupLogin');
  });

  it('msgAppClosed calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgAppClosed();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/appClosed');
  });

  it('msgAppStarted calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgAppStarted();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/appStarted');
  });


  // test getRequestContent
  it('getRequestContent returns a Promise of default object if application.getRequestContent is not a function', function (done) {
    var application = {};
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    expect(adapter.getRequestContent('hello').then).toEqual(jasmine.any(Function));
    adapter.getRequestContent('hello').then(function (obj) {
      expect(obj).toEqual({
        content: 'hello',
        structured_content: 'hello',
        isPublic: true
      });
      done();
    });
  });

  it('getRequestContent returns a Promise of default object if some properties of the return value from application.getRequestContent are missing', function (done) {
    var application = {
      getRequestContent: function (content) {
        return Promise.resolve({
          content: content,
          structured_content: ''
        });
      }
    };
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    adapter.getRequestContent('hello').then(function (obj) {
      expect(obj).toEqual({
        content: 'hello',       // specified by the application, it should keep
        structured_content: '', // specified by the application, it should keep
        isPublic: true          // default value
      });
      done();
    });
  });

  it('getRequestContent returns a Promise of object from application.getRequestContent', function (done) {
    var application = {
      getRequestContent: function (content) {
        return Promise.resolve({
          content: content + '123',
          structured_content: 'hi!',
          isPublic: false
        });
      }
    };
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    adapter.getRequestContent('hello').then(function (obj) {
      expect(obj).toEqual({
        content: 'hello123',
        structured_content: 'hi!',
        isPublic: false
      });
      done();
    });
  });

  it('postprocessLink returns a Promise of original link if application.postprocessLink is not a function', function (done) {
    var application = {};
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    expect(adapter.postprocessLink('http://privlyalpha.com/123').then).toEqual(jasmine.any(Function));
    adapter.postprocessLink('http://privlyalpha.com/123').then(function (newUrl) {
      expect(newUrl).toBe('http://privlyalpha.com/123');
      done();
    });
  });

  it('postprocessLink returns a Promise of processed link from application.postprocessLink', function (done) {
    var application = {
      postprocessLink: function (link) {
        return Promise.resolve(link + 'magic');
      }
    };
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    adapter.postprocessLink('http://privlyalpha.com/123').then(function (newUrl) {
      expect(newUrl).toBe('http://privlyalpha.com/123magic');
      done();
    });
  });

  it('getTTLOptions returns a Promise of empty array if application.getTTLOptions is not a function', function (done) {
    var application = {};
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    expect(adapter.getTTLOptions().then).toEqual(jasmine.any(Function));
    adapter.getTTLOptions().then(function (options) {
      expect(options).toEqual([]);
      done();
    });
  });

  it('getTTLOptions returns a Promise of options from application.getTTLOptions', function (done) {
    var application = {
      getTTLOptions: function () {
        return Promise.resolve([
          {ttl: 1, text: 'text for 1'},
          {ttl: 10, text: 'text for 10'},
        ]);
      }
    };
    var adapter = new Privly.app.viewAdapter.Seamless(application);
    adapter.getTTLOptions().then(function (options) {
      expect(options).toEqual([
        {ttl: 1, text: 'text for 1'},
        {ttl: 10, text: 'text for 10'},
      ]);
      done();
    });
  });

  it('onHitKey calls msgEmitEnterEvent if keyCode is 13', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.msgEmitEnterEvent = function (modifier) {
      expect(modifier.ctrl).toBe(true);
      done();
    };
    adapter.onHitKey({
      keyCode: 13,
      ctrlKey: true
    });
  });

  it('calls onUserClose if receives message userClose', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.onUserClose = function () {
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/userClose'
    });
  });

  it('calls updateStyle if receives message updateStyles', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.updateStyle = function (styles) {
      expect(styles.borderColor).toBe('red');
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/updateStyles',
      styles: {
        borderColor: 'red'
      }
    });
  });

  it('calls onStateChanged if receives message stateChanged', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.onStateChanged = function (state) {
      expect(state).toBe('OPEN');
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/stateChanged',
      state: 'OPEN'
    });
  });

  it('calls onSetTTL if receives message setTTL', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless({});
    adapter.onSetTTL = function (ttl) {
      expect(ttl).toBe('180');
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/setTTL',
      ttl: '180'
    });
  });

  it('loadLink returns plaintext when user has edit permissions', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.loadLink(testPrivlyUrl).then(function (plaintext) {
      // expect plaintext
      expect(plaintext).toBe('123');
      expect(adapter.privlyUrl).toBe(testPrivlyUrl);
      expect(adapter.requestUrl).toBe(testDataUrl);
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('loadLink rejects when user does not have edit permissions', function (done) {
    testJson.permissions = {
      canshow: true,
      canupdate: false,
      candestroy: false,
      canshare: true
    };
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.loadLink(testPrivlyUrl).then(function () {
      // should not go here
      expect(true).toBe(false);
      done();
    }, function () {
      // expect a rejection
      done();
    });
  });

  it('loadLink rejects when the content was destroyed', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.loadLink(testDestroyedUrl).then(function () {
      // should not go here
      expect(true).toBe(false);
      done();
    }, function () {
      // expect a rejection
      done();
    });
  });

  it('createLink send requests to create a new link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.createLink().then(function (link) {
      expect(privlyNetworkService.sameOriginPostRequest).toHaveBeenCalled();
      expect(requestJson.content).toBe('hello');
      expect(requestJson.structured_content).toBe('');
      expect(requestJson.public).toBe(true);
      expect(requestJson.privly_application).toBe('PlainPost');
      expect(link).toBe(testPrivlyUrl);
      expect(adapter.privlyUrl).toBe(testPrivlyUrl);
      expect(adapter.requestUrl).toBe(testDataUrl);
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('updateLink does not send requests when link is not loaded or created', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    document.getElementsByTagName('TEXTAREA')[0].value = 'hello2';
    adapter.updateLink().then(function () {
      expect(privlyNetworkService.sameOriginPutRequest).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('updateLink send requests to update the loaded or created link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.loadLink(testPrivlyUrl).then(function () {
      document.getElementsByTagName('TEXTAREA')[0].value = 'hello2';
      adapter.updateLink().then(function () {
        expect(privlyNetworkService.sameOriginPutRequest).toHaveBeenCalled();
        expect(requestJson.content).toBe('hello2');
        done();
      }, function () {
        // should not go here
        expect(true).toBe(false);
        done();
      });
    });
  });

  it('deleteLink does not send requests when link is not loaded or created', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.deleteLink().then(function () {
      expect(privlyNetworkService.sameOriginDeleteRequest).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('deleteLink send requests to delete the loaded or created link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.loadLink(testPrivlyUrl).then(function () {
      adapter.deleteLink().then(function () {
        expect(privlyNetworkService.sameOriginDeleteRequest).toHaveBeenCalled();
        done();
      }, function () {
        // should not go here
        expect(true).toBe(false);
        done();
      });
    });
  });

  it('onConnectionCheckSucceeded will create a link if the content does not contain a Privly link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.beginContentClearObserver = function () {
      return Promise.resolve();
    };
    adapter.msgGetTargetText = function () {
      return Promise.resolve('hello');
    };
    adapter.msgInsertLink = function () {
      return Promise.resolve(true);
    };
    spyOn(adapter, 'loadLink').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'msgAppStarted').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckSucceeded().then(function () {
      expect(adapter.loadLink).not.toHaveBeenCalled();
      expect(adapter.createLink).toHaveBeenCalled();
      expect(adapter.msgAppStarted).toHaveBeenCalled();
      expect(adapter.msgAppClosed).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('onConnectionCheckSucceeded will load the link if the content contains a editable Privly link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.beginContentClearObserver = function () {
      return Promise.resolve();
    };
    adapter.msgGetTargetText = function () {
      return Promise.resolve(testPrivlyUrl);
    };
    adapter.msgInsertLink = function () {
      return Promise.resolve(true);
    };
    spyOn(adapter, 'loadLink').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'msgAppStarted').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckSucceeded().then(function () {
      expect(document.getElementsByTagName('TEXTAREA')[0].value).toBe('123');
      expect(adapter.loadLink).toHaveBeenCalled();
      expect(adapter.createLink).not.toHaveBeenCalled();
      expect(adapter.msgAppStarted).toHaveBeenCalled();
      expect(adapter.msgAppClosed).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('onConnectionCheckSucceeded will create a link if the content contains a non-editable Privly link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    testJson.permissions = {
      canshow: true,
      canupdate: false,
      candestroy: false,
      canshare: true
    };
    adapter.beginContentClearObserver = function () {
      return Promise.resolve();
    };
    adapter.msgGetTargetText = function () {
      return Promise.resolve(testPrivlyUrl);
    };
    adapter.msgInsertLink = function () {
      return Promise.resolve(true);
    };
    spyOn(adapter, 'loadLink').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'msgAppStarted').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckSucceeded().then(function () {
      expect(adapter.loadLink).toHaveBeenCalled();
      expect(adapter.createLink).toHaveBeenCalled();
      expect(adapter.msgAppStarted).toHaveBeenCalled();
      expect(adapter.msgAppClosed).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('onConnectionCheckSucceeded will create a link if the content contains an invalid Privly link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.beginContentClearObserver = function () {
      return Promise.resolve();
    };
    adapter.msgGetTargetText = function () {
      return Promise.resolve(testDestroyedUrl);
    };
    adapter.msgInsertLink = function () {
      return Promise.resolve(true);
    };
    spyOn(adapter, 'loadLink').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'msgAppStarted').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckSucceeded().then(function () {
      expect(adapter.loadLink).toHaveBeenCalled();
      expect(adapter.createLink).toHaveBeenCalled();
      expect(adapter.msgAppStarted).toHaveBeenCalled();
      expect(adapter.msgAppClosed).not.toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('onConnectionCheckSucceeded will fail if insertion link fails', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.beginContentClearObserver = function () {
      return Promise.resolve();
    };
    adapter.msgGetTargetText = function () {
      return Promise.resolve('hello');
    };
    adapter.msgInsertLink = function () {
      return Promise.resolve(false);
    };
    spyOn(adapter, 'loadLink').and.callThrough();
    spyOn(adapter, 'createLink').and.callThrough();
    spyOn(adapter, 'msgAppStarted').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckSucceeded().then(function () {
      expect(adapter.loadLink).not.toHaveBeenCalled();
      expect(adapter.createLink).toHaveBeenCalled();
      expect(adapter.msgAppStarted).not.toHaveBeenCalled();
      expect(adapter.msgAppClosed).toHaveBeenCalled();
      done();
    }, function () {
      // should not go here
      expect(true).toBe(false);
      done();
    });
  });

  it('onConnectionCheckFailed will destroy the app', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onConnectionCheckFailed().then(function () {
      expect(adapter.msgAppClosed).toHaveBeenCalled();
      done();
    });
  });

  it('beginContentClearObserver close the app if target content does not contain our created link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp, {observeInterval: 50});
    adapter.msgGetTargetContent = function () {
      return Promise.resolve('cleared');
    };
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.loadLink(testPrivlyUrl).then(function () {
      adapter.beginContentClearObserver();
      setTimeout(function () {
        expect(adapter.msgAppClosed).toHaveBeenCalled();
        expect(adapter.clearObserver).toBe(null);
        done();
      }, 100);
    });
  });

  it('beginContentClearObserver does not close the app if target content contains our created link', function (done) {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp, {observeInterval: 50});
    adapter.msgGetTargetContent = function () {
      return Promise.resolve(testPrivlyUrl);
    };
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.loadLink(testPrivlyUrl).then(function () {
      adapter.beginContentClearObserver();
      setTimeout(function () {
        expect(adapter.msgAppClosed).not.toHaveBeenCalled();
        expect(adapter.clearObserver).not.toBe(null);
        clearInterval(adapter.clearObserver);
        done();
      }, 100);
    });
  });

  it('onSetTTL calls updateLink', function () {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    spyOn(adapter, 'updateLink').and.callThrough();
    adapter.onSetTTL('');
    expect(adapter.updateLink).toHaveBeenCalled();
  });

  it('updateStyle updates textarea styles', function () {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.updateStyle({
      'borderColor': 'red',
      'fontSize': '14px'
    });
    var textarea = document.getElementsByTagName('TEXTAREA')[0];
    expect(textarea.style.borderColor).toBe('red');
    expect(textarea.style.fontSize).toBe('14px');
  });

  it('onUserClose calls deleteLink and destroys the app', function () {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    adapter.msgSetTargetText = function () {
      return Promise.resolve();
    };
    spyOn(adapter, 'deleteLink').and.callThrough();
    spyOn(adapter, 'msgAppClosed').and.callThrough();
    adapter.onUserClose().then(function () {
      expect(adapter.deleteLink).toHaveBeenCalled();
      expect(adapter.msgAppClosed).toHaveBeenCalledWith('hello');
    });
  });

  it('start sets button state to loading', function () {
    var adapter = new Privly.app.viewAdapter.Seamless(testApp);
    spyOn(adapter, 'msgStartLoading').and.callThrough();
    adapter.start();
    expect(adapter.msgStartLoading).toHaveBeenCalled();
  });

});
