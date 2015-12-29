/**
 * @fileOverview Privly.EventEmitter test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect */
/*global Privly */
describe('Privly.EventEmitter', function () {

  it('can pass arguments to event listeners', function () {
    var ee = new Privly.EventEmitter();
    var c = null;

    ee.on('A', function () {
      c = [].slice.call(arguments);
    });

    ee.emit('A');
    expect(c).toEqual([]);

    ee.emit('A', null);
    expect(c).toEqual([null]);

    ee.emit('A', 1, null);
    expect(c).toEqual([1, null]);

    ee.emit('A', null, 1);
    expect(c).toEqual([null, 1]);

    ee.emit('A', undefined);
    expect(c).toEqual([undefined]);

    ee.emit('A', 1, 2, 3, 4);
    expect(c).toEqual([1, 2, 3, 4]);

    ee.emit('A', {hi: 123});
    expect(c).toEqual([{hi: 123}]);
  });

  it('can add event listeners on multiple events', function () {
    var ee = new Privly.EventEmitter();
    var counter = {'A': 0, 'B': 0, 'C': 0, 'D': 0};

    ee.on('A', function () {
      counter.A++;
    });
    ee.on('B', function () {
      counter.B++;
    });
    ee.on('C', function () {
      counter.C++;
    });

    // test emit after listen
    ee.emit('C');
    expect(counter.A).toBe(0);
    expect(counter.B).toBe(0);
    expect(counter.C).toBe(1);

    ee.emit('C');
    expect(counter.A).toBe(0);
    expect(counter.B).toBe(0);
    expect(counter.C).toBe(2);

    ee.emit('A');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(0);
    expect(counter.C).toBe(2);

    ee.emit('B');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(1);
    expect(counter.C).toBe(2);

    ee.emit('B');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(2);
    expect(counter.C).toBe(2);

    // test listen after emit
    ee.emit('D');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(2);
    expect(counter.C).toBe(2);
    expect(counter.D).toBe(0);

    ee.on('D', function () {
      counter.D++;
    });

    expect(counter.A).toBe(1);
    expect(counter.B).toBe(2);
    expect(counter.C).toBe(2);
    expect(counter.D).toBe(0);

    ee.emit('D');
    ee.emit('D');

    expect(counter.A).toBe(1);
    expect(counter.B).toBe(2);
    expect(counter.C).toBe(2);
    expect(counter.D).toBe(2);
  });

  it('can add multiple event listeners on a single event', function () {
    var ee = new Privly.EventEmitter();
    // use string to check event listener calling sequence
    var counter = {'A': ''};

    ee.on('A', function () {
      counter.A += 'a1';
    });

    ee.emit('A');
    ee.emit('A');
    ee.emit('B');
    ee.emit('B');

    expect(counter.A).toBe('a1a1');

    // add another event listener
    ee.on('A', function () {
      counter.A += 'a2';
    });

    ee.emit('A');

    expect(counter.A).toBe('a1a1a1a2');

    ee.on('A', function () {
      counter.A += 'a3';
    });

    ee.emit('A');
    ee.emit('A');

    expect(counter.A).toBe('a1a1a1a2a1a2a3a1a2a3');
  });

  it('can add the same event handler to different events', function () {
    var ee = new Privly.EventEmitter();
    var counter = {'A': 0, 'B': 0};
    var eventListener = function (param) {
      counter[param]++;
    };

    ee.on('A', eventListener);
    ee.on('B', eventListener);

    ee.emit('A', 'A');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(0);

    ee.emit('B', 'B');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(1);
  });

  it('can not add the same event handler to the same event', function () {
    var ee = new Privly.EventEmitter();
    var counter = {'A': 0, 'B': 0};
    var eventListener1 = function () {
      counter.A++;
    };
    var eventListener2 = function () {
      counter.B++;
    };

    ee.on('A', eventListener1);
    ee.on('A', eventListener1);
    ee.on('A', eventListener1);
    ee.on('A', eventListener2);
    
    ee.emit('A');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(1);

    ee.on('A', eventListener1);

    ee.emit('A');
    expect(counter.A).toBe(2);
    expect(counter.B).toBe(2);

    ee.on('A', eventListener1);

    ee.emit('A');
    expect(counter.A).toBe(3);
    expect(counter.B).toBe(3);
  });

  it('can remove a single event listener on an event', function () {
    var ee = new Privly.EventEmitter();
    var counter = {'A': 0, 'B': 0, 'A2': 0};
    var eventListener = function (param) {
      counter[param]++;
    };
    var eventListenerAlways = function () {
      counter.A2++;
    }

    // add and remove
    ee.on('A', eventListener);
    ee.on('A', eventListenerAlways);
    ee.on('B', eventListener);
    ee.off('A', eventListener);

    ee.emit('A', 'A');
    expect(counter.A).toBe(0);
    expect(counter.B).toBe(0);
    expect(counter.A2).toBe(1);

    ee.emit('B', 'B');
    expect(counter.A).toBe(0);
    expect(counter.B).toBe(1);
    expect(counter.A2).toBe(1);

    // add back
    ee.on('A', eventListener);
    ee.emit('A', 'A');
    ee.emit('B', 'B');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(2);
    expect(counter.A2).toBe(2);

    // add a duplicate event listener, it should have no effects
    ee.on('A', eventListener);
    ee.emit('A', 'A');
    ee.emit('B', 'B');
    expect(counter.A).toBe(2);
    expect(counter.B).toBe(3);
    expect(counter.A2).toBe(3);
  });

  it('can remove all event listeners on an event', function () {
    var ee = new Privly.EventEmitter();
    var counter = 0;

    ee.off('A');
    ee.off('B');

    // they are two different event listeners
    ee.on('A', function () {
      counter++;
    });
    ee.on('A', function () {
      counter++;
    });

    ee.emit('A');
    expect(counter).toBe(2);

    // remove a non-exist listener
    ee.off('A', function() {});

    ee.emit('A');
    expect(counter).toBe(4);

    // remove all
    ee.off('A');

    ee.emit('A');
    expect(counter).toBe(4);
  });

  it('allow event listeners to stop other event listeners being fired', function () {
    var ee = new Privly.EventEmitter();
    var counter = {'A': 0, 'B': 0};

    ee.on('A', function () {
      counter.A++;
      return 'hi'; // stop others
    });
    ee.on('A', function () {
      counter.B++;
    });

    expect(ee.emit('A')).toBe('hi');
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(0);

    ee.off('A');
    ee.on('A', function () {
      counter.B++;
    });

    expect(ee.emit('A')).toBe(undefined);
    expect(counter.A).toBe(1);
    expect(counter.B).toBe(1);
  });

  it('returns a Promise for emitAsync', function () {
    var ee = new Privly.EventEmitter();
    ee.on('A', function () {
      return;
    });
    ee.on('B', function () {
      return null;
    });
    ee.on('C', function () {
      return undefined;
    });
    ee.on('D', function () {
      return 0;
    });
    ee.on('E', function () {
      return false;
    });
    ee.on('F', function () {
      return 1;
    });
    ee.on('G', function () {
      return true;
    });
    ee.on('H', function () {
      return 'hi';
    });
    ee.on('I', function () {
      return new Promise(function () {});
    });

    expect(ee.emitAsync('A').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('B').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('C').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('D').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('E').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('F').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('G').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('H').then).toEqual(jasmine.any(Function));
    expect(ee.emitAsync('I').then).toEqual(jasmine.any(Function));
  });

  it('returns a resolved Promise for emitAsync if the listeners do not return a Promise', function () {
    var ee = new Privly.EventEmitter();
    ee.on('A', function () {
      return;
    });
    ee.on('B', function () {
      return 123;
    });

    ee.emitAsync('A').then(function (val) {
      expect(val).toBe(undefined);
    });

    ee.emitAsync('B').then(function (val) {
      expect(val).toBe(123);
    });

    ee.emitAsync('C').then(function (val) {
      expect(val).toBe(undefined);
    });
  });

  it('returns the Promise for emitAsync if the listeners return a Promise', function (done) {
    var ee = new Privly.EventEmitter();
    ee.on('A', function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve('LOL');
        }, 1);
      });
    });
    ee.emitAsync('A').then(function (val) {
      expect(val).toBe('LOL');
      done();
    });
  });

  it('can make existing class into an EventEmitter', function () {
    var My = function () {};
    Privly.EventEmitter.inherit(My);

    var ee = new Privly.EventEmitter();
    var myee = new My();
    expect(myee.on).toBe(ee.on);
    expect(myee.off).toBe(ee.off);
    expect(myee.emit).toBe(ee.emit);
    expect(myee.emitAsync).toBe(ee.emitAsync);

    myee.on('A', function (val) {
      expect(val).toBe('yo');
    });
    myee.emit('A', 'yo');
  });

});
