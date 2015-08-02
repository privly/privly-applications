/**
 * @fileOverview This file provides an fundamental interface to read and write
 * Privly extension options. In extension environment, it should be loaded into
 * every privly-application webpage and background pages.
 *
 * As a fundamental interface, it provides Privly.options.* to read and write
 * Privly extension options.
 * 
 * As a background script, it listens onInstall events to upgrade old option values
 * when user installs the extension and listens incoming Chrome messages to provide
 * interface to read and write extension options for content scripts and other pages.
 *
 * Chrome background sample incoming message:
 *   {ask: 'options/setPrivlyButtonEnabled', params: [true]}
 *   will call: Privly.options.setPrivlyButtonEnabled(true)
 *   return values are sent via message response.
 *
 * For more information about the whitelist, read:
 * https://github.com/privly/privly-organization/wiki/whitelist
 *
 * Local Storage Bindings Used:
 *
 * - options/injection {Boolean}
 *     Whether to enable content injection.
 *
 * - options/options/privlyButton {Boolean}
 *     Whether to enable Privly posting button. Privly posting button is a
 *     clickable button on the top-right corner of the editable element, allows
 *     user to create a Privly message conveniently.
 *
 * - options/whitelist/domains {[String]}
 *     An array of servers the user can provide to specify which servers they
 *     trust to automatically inject into the host page. This array is presented
 *     to the user every time they visit options, but the string used by the
 *     content script is `options/whitelist/regexp`.
 *
 * - options/whitelist/regexp {String}
 *     This string is formatted specifically so that privly.js can update its
 *     whitelist regexp.
 *
 * - options/contentServer/url {String}
 *     The content server the user will post to when generating new content.
 *
 * - options/glyph {Object} A consistent visual identifier to prevent spoofing
 *     color {String} The cell color of the glyph.
 *     cells {[Boolean]} The bitmap of the glyph cell.
 * 
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
  if (Privly.options !== undefined) {
    return;
  }
  Privly.options = {};

  // CommonJS Module
  if (typeof module !== "undefined" && module.exports) {
    module.exports.options = Privly.options;
    // load dependencies
    ls = require("./local_storage.js").ls;
    Privly.storage = require("./storage.js").storage;
    Privly.message = require("./context_messenger.js").message;
  }


  /**
   * Broadcast option changed message
   * @param  {[type]} optionName
   * @param  {[type]} optionValue The new value of the option
   */
  function optionChanged(optionName, optionValue) {
    var message = {
      action: 'options/changed',
      option: optionName,
      newValue: optionValue
    };
    Privly.message.messageExtension(message);
    Privly.message.messageContentScripts(message);
  }

  /**
   * Update old option names to newer ones.
   * Will be called when user updates the extension.
   */
  Privly.options.upgrade = function () {
    // Privly posting button
    var disableButton = ls.getItem('Options:DissableButton');
    if (disableButton !== undefined) {
      try {
        Privly.options.setPrivlyButtonEnabled((disableButton !== true));
        ls.removeItem('Options:DissableButton');
      } catch (ignore) {}
    }
    // Whitelist CSV
    var userWhitelistCSV = ls.getItem('user_whitelist_csv');
    if (userWhitelistCSV !== undefined) {
      try {
        Privly.options.setWhitelist(userWhitelistCSV.split(','));
        ls.removeItem('user_whitelist_csv');
      } catch (ignore) {}
    }
    // Whitelist JSON
    var userWhitelistJSON = ls.getItem('user_whitelist_json');
    if (userWhitelistJSON !== undefined) {
      try {
        Privly.options.setWhitelist(userWhitelistJSON);
        ls.removeItem('user_whitelist_json');
      } catch (ignore) {}
    }
    // Content Server Url
    var postingContentServerUrl = ls.getItem('posting_content_server_url');
    if (postingContentServerUrl !== undefined) {
      try {
        Privly.options.setServerUrl(postingContentServerUrl);
        ls.removeItem('posting_content_server_url');
      } catch (ignore) {}
    }
    // Glyph
    var glyphColor = ls.getItem('glyph_color');
    var glyphCell = ls.getItem('glyph_cells');
    if (glyphColor !== undefined && glyphCell !== undefined) {
      // ls.setItem(..., "001122") would become number 1122 when calling ls.getItem(...)
      glyphColor = String(glyphColor);
      glyphColor = '000000'.substr(0, 6 - glyphColor.length) + glyphColor;
      try {
        Privly.options.setGlyph({
          color: glyphColor,
          cells: glyphCell.split(',').map(function (fill) {
            return (fill === 'true');
          })
        });
        ls.removeItem('glyph_color');
        ls.removeItem('glyph_cells');
      } catch (ignore) {}
    }
  };

  // If this script is running as a background script
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getBackgroundPage) {
    // Set event listeners to execute upgrade() function when
    // the extension got installed.
    chrome.runtime.onInstalled.addListener(function () {
      Privly.options.upgrade();
    });
  }

  // Listen incoming messages to provide option interfaces
  // for content scripts
  function requestOptionInterface(request, sendResponse) {
    if (request.ask && request.ask.indexOf('options/') === 0) {
      var method = request.ask.split('/')[1];
      if (Privly.options[method] !== undefined) {
        var returnValue = Privly.options[method].apply(Privly.options, request.params);
        sendResponse(returnValue);
      }
    }
  }
  Privly.message.addListener(requestOptionInterface);

  /**
   * Whether Privly posting button is enabled
   * @return {Boolean}
   */
  Privly.options.isPrivlyButtonEnabled = function () {
    var v = Privly.storage.get('options/privlyButton');
    if (v === null) {
      v = false;
    }
    return v;
  };

  /**
   * Enable or disable the Privly posting button
   * @param {Boolean} enabled
   */
  Privly.options.setPrivlyButtonEnabled = function (enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('invalid argument');
    }
    Privly.storage.set('options/privlyButton', enabled);
    optionChanged('options/isPrivlyButtonEnabled', enabled);
    return true;
  };

  /**
   * Whether content injection is enabled
   * @return {Boolean}
   */
  Privly.options.isInjectionEnabled = function () {
    var v = Privly.storage.get('options/injection');
    if (v === null) {
      v = true;
    }
    return v;
  };

  /**
   * Enable or diable content injection
   * @param {Boolean} enabled
   */
  Privly.options.setInjectionEnabled = function (enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('invalid argument');
    }
    Privly.storage.set('options/injection', enabled);
    optionChanged('options/isInjectionEnabled', enabled);
    return true;
  };

  /**
   * Validates a FQDN
   * @param  {String}  domain Domain to validate
   * @return {Boolean}
   */
  Privly.options.isDomainValid = function (domain) {
    // Each subdomain can be from 1-63 characters and may contain alphanumeric
    // characters, - and _ but may not begin or end with - or _
    // Each domain can be from 1-63 characters and may contain alphanumeric 
    // characters and - but may not begin or end with - Each top level domain may
    // be from 2 to 9 characters and may contain alpha characters
    var validateSubdomain = /^(?!\-|_)[\w\-]{1,63}/g; //subdomains
    var validateDomain = /^(?!\-)[a-zA-Z0-9\-?]{1,63}$/g; //domain
    var validateDomainAndPort = /^(?!\-)[a-zA-Z0-9\-?]{1,63}(?::\d+)?$/g;
    var validateTLD = /^[a-zA-Z]{2,9}(?::\d+)?$/g; //top level domain

    //needed because js regex does not have look-behind
    var notEndInHyphenOrUnder = /[^\-_]$/g;
    var notEndInHyphen = /[^\-]$/g;

    var parts = domain.split(".");
    var valid_parts_count = 0;

    //iterate over domains, split by .
    var j;
    for (j = 0; j < parts.length; j++) {
      switch (j) {
      case parts.length - 1: // validate TLD or Domain if no TLD present
        if (parts.length === 1) {
          if (parts[j].match(validateDomainAndPort)) {
            valid_parts_count++;
          }
        } else {
          if (parts[j].match(validateTLD)) {
            valid_parts_count++;
          }
        }
        break;
      case parts.length - 2: // validate Domain
        if (parts[j].match(validateDomain) &&
            parts[j].match(notEndInHyphen)) {
          valid_parts_count++;
        }
        break;
      default: // validate Subdomain(s)
        if (parts[j].match(validateSubdomain) &&
            parts[j].match(notEndInHyphenOrUnder)) {
          valid_parts_count++;
        }
        break;
      }
    }

    //if all parts of domain are valid
    //append to regex for restricting domains of injected content
    return valid_parts_count === parts.length;
  };

  /**
   * Get user whitelist as JSON
   * @return {[String]} Array of whitelists
   */
  Privly.options.getWhitelistDomains = function () {
    var v = Privly.storage.get('options/whitelist/domains');
    if (v === null) {
      v = [];
    }
    return v;
  };

  /**
   * Get user whitelist as RegExp
   * @return {[String]} Array of whitelists
   */
  Privly.options.getWhitelistRegExp = function () {
    var v = Privly.storage.get('options/whitelist/regexp');
    if (v === null) {
      v = '';
    }
    return v;
  };

  /**
   * Update or set user whitelist
   * @param {String} whitelist
   */
  Privly.options.setWhitelist = function (whitelist) {
    // typeof null === 'object'
    if (typeof whitelist !== 'object' || whitelist === null || Object.prototype.toString.call(whitelist) !== "[object Array]") {
      throw new Error('invalid argument');
    }
    var regexp = ''; // stores regex to match validated domains
    var domains = whitelist.map(function (domain) {
      if (typeof domain !== 'string') {
        throw new Error('invalid argument');
      }
      domain = domain.toLowerCase();
      regexp += '|' + domain.replace(/\./g, '\\.') + '\\\/';
      if (!Privly.options.isDomainValid(domain)) {
        throw new Error('invalid domain');
      }
      return domain;
    });

    Privly.storage.set('options/whitelist/domains', domains);
    optionChanged('options/getWhitelistDomains', domains);
    Privly.storage.set('options/whitelist/regexp', regexp);
    optionChanged('options/getWhitelistRegExp', regexp);
    return true;
  };

  /**
   * Get content server Url
   * @return {String}
   */
  Privly.options.getServerUrl = function () {
    var v = Privly.storage.get('options/contentServer/url');
    if (v === null) {
      v = 'https://privlyalpha.org';
    }
    return v;
  };

  /**
   * Set content server Url
   * @param {String} url
   */
  Privly.options.setServerUrl = function (url) {
    if (typeof url !== 'string') {
      throw new Error('invalid argument');
    }
    Privly.storage.set('options/contentServer/url', url);
    optionChanged('options/getServerUrl', url);
    return true;
  };

  /**
   * Get user glyph cells and color
   * @return {Object|undefined}
   *   {String} color
   *   {[Boolean]} cells
   */
  Privly.options.getGlyph = function () {
    return Privly.storage.get('options/glyph');
  };

  /**
   * Set user glyph cells and color
   * @param {Object} glyph
   *   {String} color
   *   {[Boolean]} cells
   */
  Privly.options.setGlyph = function (glyph) {
    // typeof null === 'object'
    if (typeof glyph !== 'object' || glyph === null) {
      throw new Error('invalid argument');
    }
    // "glyph.cells.constructor !== Array" is not a safe check for "Array" data type.
    // Does not work if this script(options.js) is loaded in a different global environment than
    // glyph.js, i.e, when the scripts are loaded as CommonJS modules.
    if (typeof glyph.color !== 'string' || typeof glyph.cells !== 'object' || 
        glyph.cells === null || Object.prototype.toString.call(glyph.cells) !== "[object Array]") {
      throw new Error('invalid argument');
    }
    var obj = {
      color: glyph.color,
      cells: glyph.cells
    };
    Privly.storage.set('options/glyph', obj);
    optionChanged('options/getGlyph', obj);
    return true;
  };
}());
