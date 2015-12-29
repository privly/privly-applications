/**
 * @deprecated Use Privly.storage
 * 
 * @namespace A shim to support cross browser Local Storage. This
 * shim mimics the localStorage API, but it will use alternate
 * storage mechanisms if localStorage is not available.
 */
var ls = {
  
  /**
   * Indicates whether the native localStorage API is available on the
   * current platform.
   */
  localStorageDefined: true,

  /**
   * Set an item to local storage. If the item is not a string, this
   * function will attempt to serialize it using the JSON.stringify
   * function.
   * @deprecated
   * @param {string|object} key is the string to store in key/value storage.
   * @param {string} value is the value to assign to the key.
   */
  setItem: function(key, value) {
    if ( typeof(value) !== "string" ){
      value = JSON.stringify(value);
    }

    if ( ls.localStorageDefined ) {
      localStorage.setItem(key, value);
    } else {
      ls.preferences.setCharPref(key, value);
    }

    return value;
  },

  /**
   * LocalStorage getter returns the stored value if it is defined.
   * The string value stored attempts to reconstruct an object using
   * the JSON.parse api. If parsing an object fails, the string will
   * be returned.
   * @deprecated
   * @param {string} key the value to retrieve from local storage.
   * @return {string|object} Representing the current value of the key.
   */
  getItem: function(key) {
    if ( ls.localStorageDefined ) {
      var value = localStorage.getItem(key);
      if (value === null){
        return undefined;
      }
      try {  // try to parse stored value as JSON
        var parsed = JSON.parse(value);
        return parsed;
      } catch(e) { // return original value
        return value;
      }
    } else {
      try {
        try { // try to parse stored value as JSON
          var value = JSON.parse(ls.preferences.getCharPref(key));
          return value;
        } catch(e){
          return ls.preferences.getCharPref(key);
        }
      } catch(e) {
        console.warn("Local Storage key was not in storage");
        return undefined;
      }
    }
  },

  /**
   * Remove an item from local storage.
   * @deprecated
   * @param {string} key the key to remove from storage.
   * @return {undefined} Returns undefined regardless
   * of whether the key existed in localStorage.
   */
  removeItem: function(key) {
    if ( ls.localStorageDefined ) {
      return localStorage.removeItem(key);
    } else {
      try {
        ls.preferences.clearUserPref(key);
      } catch(e) {
        console.warn("Local Storage key was not in storage when it was removed");
      }
      return undefined;
    }
  }
};

// Checks the platform the script is running in, selects the appropriate storage driver
try {
  // Chrome/Safari
  localStorage;
} catch(e) {
  // Firefox
  ls.localStorageDefined = false;
  // Use Preferences service instead of localStorage
  if (typeof module !== 'undefined' && module.exports) {
    const components = require("chrome");
    // Preferences storage
    ls.preferences = components.Cc["@mozilla.org/preferences-service;1"].
                       getService(components.Ci.nsIPrefService).
                       getBranch("extensions.privly.");
    // Loaded as a CommonJS module, reused as a Local Storage shim 
    // in lib/local_storage.js.
    module.exports.ls = ls;

  } else {
    // Privileged JS code run in a firefox "chrome://" page. for eg:- ChromeFirstRun page.
    // Components can be accessed.
    // Preferences Storage
    ls.preferences = Components.classes["@mozilla.org/preferences-service;1"].
                       getService(Components.interfaces.nsIPrefService).
                       getBranch("extensions.privly.");
  }
}
