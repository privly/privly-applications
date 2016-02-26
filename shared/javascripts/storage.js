/**
 * @fileOverview This file provides a uniform interface for
 * reading and writing storage values. Objects are always JSON
 * serialized or unserialized when writing or reading.
 * 
 * This file is a replacement of local_storage.js. Currently this file
 * depends on local_storage.js to provide compatibilility functionality,
 * however this dependency is planned to remove in the future.
 * 
 * Although local_storage.js are still loaded in every page currently,
 * developers should not use functions in local_storage any more.
 * Use interfaces provided by this file instead.
 */
/*global chrome */
/*global Privly:true, ls */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}

(function () {

  // If this file is already loaded, don't do it again
  if (Privly.storage !== undefined) {
    return;
  }
  Privly.storage = {};

  // CommonJS Module
  if (typeof module !== "undefined" && module.exports) {
    // load dependencies
    ls = require("./local_storage.js").ls;
    Privly.message = require("./context_messenger.js").message;
    // export interfaces
    module.exports.storage = Privly.storage;
    module.exports.message = Privly.message;
    module.exports.ls = ls;
  }

  /**
   * Set an item to the storage.
   * This function doesn't return values;
   * 
   * @param {String} key
   * @param {Any} value
   */
  Privly.storage.set = function (key, value) {
    ls.setItem(key, JSON.stringify(value));

    // In the SAFARI extension, the localStorage for PRIVLY_APPLICATION
    // and the BACKGROUND_SCRIPT is different. If changes are made in the
    // PRIVLY_APPLICATION, send the corresponding message to BACKGROUND_SCRIPT
    if (Privly.message.currentAdapter.getPlatformName() === 'SAFARI' &&
        Privly.message.currentAdapter.getContextName() === 'PRIVLY_APPLICATION') {
          var message = {
            action: 'storage/set',
            key: key,
            value: value
          };
          Privly.message.messageExtension(message);
    }
  };

  /**
   * Get an item from the storage.
   * If the item doesn't exist, it returns null.
   * 
   * @param  {String} key
   * @return {Any}
   */
  Privly.storage.get = function (key) {
    var json = ls.getItem(key);
    if (json === undefined || json === null) {
      // key does not exist
      return null;
    }
    return json;
  };

  /**
   * Remove an item from the storage.
   * This function doesn't return values;
   * 
   * @param  {String} key
   */
  Privly.storage.remove = function (key) {
    ls.removeItem(key);

    // In SAFARI extension, if changes are made in the PRIVLY_APPLICATION, send
    // the corresponding message to BACKGROUND_SCRIPT
    if (Privly.message.currentAdapter.getPlatformName() === 'SAFARI' &&
        Privly.message.currentAdapter.getContextName() === 'PRIVLY_APPLICATION') {
          var message = {
            action: 'storage/remove',
            key: key
          };
          Privly.message.messageExtension(message);
    }
  };

}());
