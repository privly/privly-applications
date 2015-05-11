/**
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
      ls.storage[key] = value;
    }

    return value;
  },

  /**
   * LocalStorage getter returns the stored value if it is defined.
   * The string value stored attempts to reconstruct an object using
   * the JSON.parse api. If parsing an object fails, the string will
   * be returned.
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
          var value = JSON.parse(ls.storage[key]);
          return value;
        } catch(e){
          return ls.storage[key];
        }
      } catch(e) {
        console.warn("Local Storage key was not in storage");
        return undefined;
      }
    }
  },

  /**
   * Remove an item from local storage.
   * @param {string} key the key to remove from storage.
   * @return {undefined} Returns undefined regardless
   * of whether the key existed in localStorage.
   */
  removeItem: function(key) {
    if ( ls.localStorageDefined ) {
      return localStorage.removeItem(key);
    } else {
      try {
        delete ls.storage[key];
      } catch(e) {
        console.warn("Local Storage key was not in storage when it was removed");
      }
      return undefined;
    }
  }
};

try {
  // check for jetpack runtime environment
  exports.ls = ls;
} catch(e) {
  // Determine whether localstorage can be used directly
  try {
    localStorage;
  } catch(e) {
    // Firefox simple storage 
    ls.localStorageDefined = false;
    const PrivlyStorage = Components.classes["@privly/storage;1"].
                            getService(Components.interfaces.nsISupports).
                            wrappedJSObject;
    var ss = PrivlyStorage.getSimpleStorage();
    ls.storage = ss.storage;
  }
}
