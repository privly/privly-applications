/**
 * @fileOverview `seamless_ttlselect` view adapter test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, afterEach, jasmine, spyOn */
/*global Privly, Promise */
describe('Privly.app.viewAdapter.SeamlessTTLSelect', function () {

  var msgSent;

  beforeEach(function () {
    $(document.body).append('<div id="menu"></div>');
    msgSent = [];
    Privly.message.messageExtension = function (msg, hasResponse) {
      msgSent.push(msg);
      return Promise.resolve();
    };
    spyOn(Privly.message, 'messageExtension').and.callThrough();
  });

  afterEach(function () {
    document.body.innerHTML = "";
  });

  it('msgTTLChange calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect({});
    adapter.msgTTLChange('2147');
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/TTLChanged');
    expect(msgSent[0].value).toBe('2147');
  });

  it('msgAppReady calls Privly.message.messageExtension', function () {
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect({});
    adapter.msgAppReady({
      width: 100,
      height: 300
    });
    expect(Privly.message.messageExtension).toHaveBeenCalled();
    expect(msgSent[0].action).toBe('posting/contentScript/TTLSelectReady');
    expect(msgSent[0].size).toEqual({
      width: 100,
      height: 300
    });
  });

  it('getTTLOptions returns a Promise of empty array if application.getTTLOptions is not a function', function (done) {
    var application = {};
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
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
          {ttl: '1', text: 'text for 1'},
          {ttl: '10', text: 'text for 10'},
        ]);
      }
    };
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
    adapter.getTTLOptions().then(function (options) {
      expect(options).toEqual([
        {ttl: '1', text: 'text for 1'},
        {ttl: '10', text: 'text for 10'},
      ]);
      done();
    });
  });

  it('creates proper menu items if getTTLOptions does not contain default values and isAbove is false', function (done) {
    var application = {
      getTTLOptions: function () {
        return Promise.resolve([
          {ttl: '1', text: 'text for 1'},
          {ttl: '10', text: 'text for 10'},
        ]);
      }
    };
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
    adapter.initMenu(false, '10', function () {
      expect(document.querySelectorAll('.posting-select-item')[0].getAttribute('data-value')).toBe('1');
      expect(document.querySelectorAll('.posting-select-item')[0].innerText.trim()).toBe('text for 1');
      expect(document.querySelectorAll('.posting-select-item')[1].getAttribute('data-value')).toBe('10');
      expect(document.querySelectorAll('.posting-select-item')[1].innerText.trim()).toBe('text for 10');
      // second is selected
      expect(document.querySelectorAll('.posting-select-item')[1].classList.contains('selected')).toBe(true);
      done();
    });
  });

  it('creates proper menu items if getTTLOptions does not contain default values and isAbove is true', function (done) {
    var application = {
      getTTLOptions: function () {
        return Promise.resolve([
          {ttl: '1', text: 'text for 1'},
          {ttl: '10', text: 'text for 10'},
        ]);
      }
    };
    // if isAbove=true, the memu should be reversed so that the smallest index is always closest to user
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
    adapter.initMenu(true, '10', function () {
      expect(document.querySelectorAll('.posting-select-item')[1].getAttribute('data-value')).toBe('1');
      expect(document.querySelectorAll('.posting-select-item')[1].innerText.trim()).toBe('text for 1');
      expect(document.querySelectorAll('.posting-select-item')[0].getAttribute('data-value')).toBe('10');
      expect(document.querySelectorAll('.posting-select-item')[0].innerText.trim()).toBe('text for 10');
      expect(document.querySelectorAll('.posting-select-item')[0].classList.contains('selected')).toBe(true);
      done();
    });
  });

  it('creates proper menu items if getTTLOptions contains default value', function (done) {
    var application = {
      getTTLOptions: function () {
        return Promise.resolve([
          {ttl: '1', text: 'text for 1'},
          {ttl: '10', text: 'text for 10'},
          {ttl: '100', text: 'default value', default: true}
        ]);
      }
    };
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
    adapter.initMenu(false, null, function () {
      expect(document.querySelectorAll('.posting-select-item')[0].getAttribute('data-value')).toBe('1');
      expect(document.querySelectorAll('.posting-select-item')[0].innerText.trim()).toBe('text for 1');
      expect(document.querySelectorAll('.posting-select-item')[1].getAttribute('data-value')).toBe('10');
      expect(document.querySelectorAll('.posting-select-item')[1].innerText.trim()).toBe('text for 10');
      expect(document.querySelectorAll('.posting-select-item')[2].getAttribute('data-value')).toBe('100');
      expect(document.querySelectorAll('.posting-select-item')[2].innerText.trim()).toBe('default value');
      // default
      expect(document.querySelectorAll('.posting-select-item')[2].classList.contains('selected')).toBe(true);
      done();
    });
  });

  it('call initMenu when receives posting/app/initializeTTLSelect', function () {
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect({});
    spyOn(adapter, 'initMenu').and.callThrough();
    adapter.onMessageReceived({
      action: 'posting/app/initializeTTLSelect'
    }, function () {});
    expect(adapter.initMenu).toHaveBeenCalled();
  });

  it('call msgTTLChange when user clicks an item', function () {
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect({});
    spyOn(adapter, 'msgTTLChange').and.callThrough();
    adapter.onItemSelected({
      target: {
        getAttribute: function () {
          return '100';
        }
      }
    });
    expect(adapter.msgTTLChange).toHaveBeenCalledWith('100');
  });

  it('start will call msgAppReady', function (done) {
    var application = {
      getTTLOptions: function () {
        return Promise.resolve([
          {ttl: '1', text: 'text for 1'},
          {ttl: '10', text: 'text for 10'},
          {ttl: '100', text: 'default value', default: true}
        ]);
      }
    };
    var adapter = new Privly.app.viewAdapter.SeamlessTTLSelect(application);
    spyOn(adapter, 'msgAppReady').and.callThrough();
    adapter.start();
    setTimeout(function () {
      expect(adapter.msgAppReady).toHaveBeenCalled();
      done();
    }, 50);
  });

});
