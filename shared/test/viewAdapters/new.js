/**
 * @fileOverview `new` view adapter test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, afterEach, jasmine */
/*global Privly, Promise */
describe('Privly.app.viewAdapter.New', function () {

  beforeEach(function () {
    var domIDs = [
      "logout_link",
      "content"
    ];
    domIDs.forEach(function (id) {
      var newElement = $('<a/>', {
        id: id,
      });
      $(document.body).append(newElement);
    });
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  var eventFunctions = [
    'start', 'connectionSucceeded', 'connectionFailed', /*'save'*/,
    'pendingLogin', 'loginFailure', 'pendingPost', 'postSubmit',
    /*'createError', 'postCompleted'*/
  ];

  // functions that require parameters to work correctly are omitted here
  eventFunctions.forEach(function (funcName) {
    it('emits before events for function ' + funcName, function (done) {
      var eventName = funcName.substr(0, 1).toUpperCase() + funcName.substr(1);
      var adapter = new Privly.app.viewAdapter.New({});
      adapter.on('before' + eventName, function () {
        done();
      });
      adapter[funcName]();
    });

    it('emits after events for function ' + funcName, function (done) {
      var eventName = funcName.substr(0, 1).toUpperCase() + funcName.substr(1);
      var adapter = new Privly.app.viewAdapter.New({});
      adapter.on('after' + eventName, function () {
        done();
      });
      adapter[funcName]();
    });
  });

  var mockServerResponse = {
    jqXHR: {status: 200},
    json: {content: "hello world"}
  };

  // test createError
  it('emits before events for function createError and parameters are passed to event listeners', function (done) {
    var adapter = new Privly.app.viewAdapter.New({});
    adapter.on('beforeCreateError', function (response) {
      expect(response).toEqual(mockServerResponse);
      done();
    });
    adapter.createError(mockServerResponse);
  });

  it('emits after events for function createError', function (done) {
    var adapter = new Privly.app.viewAdapter.New({});
    adapter.on('afterCreateError', function () {
      done();
    });
    adapter.createError(mockServerResponse);
  });

  // test getRequestContent
  it('getRequestContent returns a Promise of default object if application.getRequestContent is not a function', function (done) {
    var application = {};
    var adapter = new Privly.app.viewAdapter.New(application);
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
    var adapter = new Privly.app.viewAdapter.New(application);
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
    var adapter = new Privly.app.viewAdapter.New(application);
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
    var adapter = new Privly.app.viewAdapter.New(application);
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
    var adapter = new Privly.app.viewAdapter.New(application);
    adapter.postprocessLink('http://privlyalpha.com/123').then(function (newUrl) {
      expect(newUrl).toBe('http://privlyalpha.com/123magic');
      done();
    });
  });

  it('allows hijacking a function body from being called', function (done) {
    // we test `start` function here.
    // normally `start` will call `pendingLogin`
    // beforeStart -> start -> beforePendingLogin -> afterPendingLogin -> afterStart

    // first, let's test the situation that `start` is not hijacked
    function test1() {
      var adapter = new Privly.app.viewAdapter.New({});
      var beforeStart = false, afterStart = false, beforePendingLogin = false;
      adapter.on('beforeStart', function () {
        beforeStart = true;
      });
      adapter.on('afterStart', function () {
        afterStart = true;
      });
      adapter.on('beforePendingLogin', function () {
        beforePendingLogin = true;
      });
      adapter.start();
      setTimeout(function () {
        expect(beforeStart).toBe(true);
        expect(afterStart).toBe(true);
        expect(beforePendingLogin).toBe(true);
        test2();
      }, 100);
    }

    // then, let's test hijacked situation
    function test2() {
      var adapter = new Privly.app.viewAdapter.New({});
      var beforeStart = false, afterStart = false, beforePendingLogin = false;
      adapter.on('beforeStart', function () {
        beforeStart = true;
        return true; // prevent default
      });
      adapter.on('afterStart', function () {
        afterStart = true;
      });
      adapter.on('beforePendingLogin', function () {
        beforePendingLogin = true;
      });
      adapter.start();
      setTimeout(function () {
        expect(beforeStart).toBe(true);
        expect(afterStart).toBe(true);
        expect(beforePendingLogin).toBe(false);
        done();
      }, 100);
    }
    test1();
  });

  it('save calls postSubmit', function (done) {
    var adapter = new Privly.app.viewAdapter.New({});
    spyOn(adapter, 'postSubmit').and.callThrough();
    adapter.save().then(function () {
      expect(adapter.postSubmit).toHaveBeenCalled();
      done();
    });
  });

});
