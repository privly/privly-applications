/**
 * @namespace A shim to support cross browser Local Storage. This
 * shim mimics the localStorage API, but it will use alternate
 * storage mechanisms if localStorage is not available.
 */
var ls = {
  
  /**
   * Indicates whether
   */
  localStorageDefined: true,

  /**
   * Set an item to local storage.
   * @param {string} key is the string to store in key/value storage.
   * @param {string} value is the value to assign to the key.
   */
  setItem: function(key, value) {
    if ( ls.localStorageDefined ) {
      if ( typeof(value) === "object" ){
        value = JSON.stringify(value);
      }
      return localStorage[key] = value;
    } else {
      ls.preferences.setCharPref(key, value);
      return value;
    }
  },

  /**
   * LocalStorage getter returns the stored value if it is defined.
   * @param {string} key the value to retrieve from local storage.
   * @return {string} Representing the current value of the key.
   */
  getItem: function(key) {
    if ( ls.localStorageDefined ) {
      try {  // try to parse stored value as JSON
        var value = JSON.parse(localStorage[key]);
        return value;
      }
      catch(e) { // return original value instead of 
        return localStorage[key];
      }
    } else {
      try {
        return ls.preferences.getCharPref(key);
      } catch(e) {
        console.warn("Local Storage key was not in storage");
        return undefined;
      }
    }
  },

  /**
   * Remove an item from local storage.
   * @param {string} key the key to remove from storage.
   */
  removeItem: function(key) {
    if ( ls.localStorageDefined ) {
      return localStorage.removeItem(key)
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

// Determine whether localstorage can be used directly
try { 
  localStorage;
} catch(e) {
  ls.localStorageDefined = false;
  
  // Assuming Xul firefox
  ls.preferences = Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.privly.");
}
