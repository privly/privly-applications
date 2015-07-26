/**
 * @fileOverview `seamless` view adapter test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/*global Privly, Promise */
describe('Privly.adapter.SeamlessPosting', function () {

  var msgSent;

  beforeEach(function () {
    msgSent = [];
    Privly.message.messageExtension = function (msg, hasResponse) {
      msgSent.push(msg);
      return Promise.resolve();
    };
    spyOn(Privly.message, 'messageExtension').and.callThrough();
  });

  it('msgTextareaFocus calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgTextareaFocus();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/textareaFocused');
  });

  it('msgStartLoading calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgStartLoading();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/loading');
    expect(msgSent[0].state).toBe(true);
  });

  it('msgStopLoading calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgStopLoading();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/loading');
    expect(msgSent[0].state).toBe(false);
  });

  it('msgGetTargetContent calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgGetTargetContent();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/getTargetContent');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgGetTargetText calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgGetTargetText();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/getTargetText');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgSetTargetText calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgSetTargetText('abc');
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/setTargetText');
    expect(msgSent[0].text).toBe('abc');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgInsertLink calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgInsertLink('http://privlyalpha.com/123');
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/insertLink');
    expect(msgSent[0].link).toBe('http://privlyalpha.com/123');
    expect(msgSent[0].hasResponse).toBe(true);
  });

  it('msgEmitEnterEvent calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
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
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgPopupLoginDialog();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/background/popupLogin');
  });

  it('msgAppClosed calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgAppClosed();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/appClosed');
  });

  it('msgAppStarted calls Privly.message.messageExtension', function () {
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.msgAppStarted();
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/appStarted');
  });


  // test getRequestContent
  it('getRequestContent returns a Promise of default object if application.getRequestContent is not a function', function (done) {
    var application = {};
    var adapter = new Privly.adapter.SeamlessPosting(application);
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
    var adapter = new Privly.adapter.SeamlessPosting(application);
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
    var adapter = new Privly.adapter.SeamlessPosting(application);
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
    var adapter = new Privly.adapter.SeamlessPosting(application);
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
    var adapter = new Privly.adapter.SeamlessPosting(application);
    adapter.postprocessLink('http://privlyalpha.com/123').then(function (newUrl) {
      expect(newUrl).toBe('http://privlyalpha.com/123magic');
      done();
    });
  });

  it('getTTLOptions returns a Promise of empty array if application.getTTLOptions is not a function', function (done) {
    var application = {};
    var adapter = new Privly.adapter.SeamlessPosting(application);
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
    var adapter = new Privly.adapter.SeamlessPosting(application);
    adapter.getTTLOptions().then(function (options) {
      expect(options).toEqual([
        {ttl: 1, text: 'text for 1'},
        {ttl: 10, text: 'text for 10'},
      ]);
      done();
    });
  });

  it('onHitKey calls msgEmitEnterEvent if keyCode is 13', function (done) {
    var adapter = new Privly.adapter.SeamlessPosting({});
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
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.onUserClose = function () {
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/userClose'
    });
  });

  it('calls updateStyle if receives message updateStyles', function (done) {
    var adapter = new Privly.adapter.SeamlessPosting({});
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
    var adapter = new Privly.adapter.SeamlessPosting({});
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
    var adapter = new Privly.adapter.SeamlessPosting({});
    adapter.onSetTTL = function (ttl) {
      expect(ttl).toBe('180');
      done();
    };
    adapter.onMessageReceived({
      action: 'posting/app/setTTL',
      ttl: '180'
    });
  });

});
