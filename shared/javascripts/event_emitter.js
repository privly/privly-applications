/**
 * @fileOverview This file implements an event emitter.
 * Developers can use Privly.EventEmitter.inherit(MyClass)
 * to bring event emitter feature to his/her own class.
 */

// If Privly namespace is not initialized, initialize it
/*global Promise */
var Privly;
if (Privly === undefined) {
  Privly = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.EventEmitter !== undefined) {
    return;
  }

  Privly.EventEmitter = function () {};

  /**
   * Add an event listener.
   * 
   * @param  {String}   ev Event name
   * @param  {Function} listener
   */
  Privly.EventEmitter.prototype.on = function (ev, listener) {
    if (this.listeners === undefined) {
      this.listeners = {};
    }
    if (!this.listeners.hasOwnProperty(ev)) {
      this.listeners[ev] = [];
    }
    if (this.listeners[ev].indexOf(listener) === -1) {
      this.listeners[ev].push(listener);
    }
  };

  /**
   * Remove an event listener.
   * 
   * @param  {String} ev Event name
   * @param  {Function} listener
   */
  Privly.EventEmitter.prototype.off = function (ev, listener) {
    // delete all event listeners
    if (listener === undefined) {
      delete this.listeners[ev];
      return;
    }
    if (this.listeners === undefined) {
      this.listeners = {};
    }
    if (!this.listeners.hasOwnProperty(ev)) {
      return;
    }
    this.listeners.splice(this.listeners[ev].indexOf(listener), 1);
  };

  /**
   * Trigger an event.
   * If an event listener returns non-undefiend values,
   * the rest of the listeners will not be called and
   * this value will be returned.
   * 
   * @param  {String} ev Event name
   * @return {Any}
   */
  Privly.EventEmitter.prototype.emit = function (ev) {
    var i, ret;
    if (this.listeners === undefined) {
      this.listeners = {};
    }
    if (!this.listeners.hasOwnProperty(ev)) {
      return;
    }
    for (i = 0; i < this.listeners[ev].length; ++i) {
      ret = this.listeners[ev][i].apply(this, Array.prototype.slice.call(arguments, 1));
      if (ret !== undefined) {
        return ret;
      }
    }
  };

  /**
   * Trigger an event and returns a resolved Promise
   * if non of the event listeners returns a Promise.
   *
   * Requires Promise loaded.
   * 
   * @param  {String} ev Event name
   * @return {Promise<Any>}
   */
  Privly.EventEmitter.prototype.emitAsync = function () {
    var retValue = this.emit.apply(this, arguments);
    if (typeof retValue === 'object' && retValue !== null && retValue.then !== undefined) {
      // event listeners returns a Promise: use the Promise as a return value
      return retValue;
    } else {
      // non return values from event listeners,
      // or event listeners returns a non-Promise value: returns a resolved Promise
      return Promise.resolve(retValue);
    }
  };

  /**
   * Helper function to add event emitter feature
   * to an object or a class.
   * 
   * @param  {Object|Function} obj
   */
  Privly.EventEmitter.inherit = function (obj) {
    var prop, dest;
    if (typeof obj === 'function') {
      dest = obj.prototype;
    } else {
      dest = obj;
    }
    for (prop in Privly.EventEmitter.prototype) {
      if (Privly.EventEmitter.prototype.hasOwnProperty(prop)) {
        dest[prop] = Privly.EventEmitter.prototype[prop];
      }
    }
  };

}());
