/**
 * @fileOverview This file provides an interface to read and write
 * Privly extension options.
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
 *     cells {[Boolean]} The bitmap of the glyp cell.
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
  if (Privly.Options !== undefined) {
    return;
  }
  Privly.Options = {};

  /**
   * Broadcast option changed message
   * @param  {[type]} optionName
   * @param  {[type]} optionValue The new value of the option
   */
  function optionChanged(optionName, optionValue) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        ask: 'option/changed',
        option: optionName,
        newValue: optionValue
      });
    }
  }

  /**
   * Update old option names to newer ones.
   * Will be called when user updates the extension.
   */
  Privly.Options.upgrade = function () {
    // Privly posting button
    var disableButton = ls.getItem('Options:DissableButton');
    if (disableButton !== undefined) {
      try {
        Privly.Options.setPrivlyButtonEnabled((disableButton !== true));
        ls.removeItem('Options:DissableButton');
      } catch (ignore) {}
    }
    // Whitelist CSV
    var userWhitelistCSV = ls.getItem('user_whitelist_csv');
    if (userWhitelistCSV !== undefined) {
      try {
        Privly.Options.setWhitelist(userWhitelistCSV.split(','));
        ls.removeItem('user_whitelist_csv');
      } catch (ignore) {}
    }
    // Whitelist JSON
    var userWhitelistJSON = ls.getItem('user_whitelist_json');
    if (userWhitelistJSON !== undefined) {
      try {
        Privly.Options.setWhitelist(JSON.parse(userWhitelistJSON));
        ls.removeItem('user_whitelist_json');
      } catch (ignore) {}
    }
    // Content Server Url
    var postingContentServerUrl = ls.getItem('posting_content_server_url');
    if (postingContentServerUrl !== undefined) {
      try {
        Privly.Options.setServerUrl(postingContentServerUrl);
        ls.removeItem('posting_content_server_url');
      } catch (ignore) {}
    }
    // Glyph
    var glyphColor = ls.getItem('glyph_color');
    var glyphCell = ls.getItem('glyph_cell');
    if (glyphColor !== undefined && glyphCell !== undefined) {
      try {
        Privly.Options.setGlyph({
          color: glyphColor,
          cells: glyphCell.split(',').map(function (fill) {
            return (fill === 'true');
          })
        });
        ls.removeItem('glyph_color');
        ls.removeItem('glyph_cell');
      } catch (ignore) {}
    }
  };


  // Set event listeners to execute upgrade() function when
  // the extension got installed.
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled && chrome.runtime.onInstalled.addListener) {
    chrome.runtime.onInstalled.addListener(function () {
      Privly.Options.upgrade();
    });
  }


  /**
   * Whether Privly posting button is enabled
   * @return {Boolean}
   */
  Privly.Options.isPrivlyButtonEnabled = function () {
    var v = ls.getItem('options/privlyButton');
    if (v === undefined) {
      v = false;
    }
    return v;
  };

  /**
   * Enable or disable the Privly posting button
   * @param {Boolean} enabled
   */
  Privly.Options.setPrivlyButtonEnabled = function (enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('invalid argument');
    }
    ls.setItem('options/privlyButton', enabled);
    optionChanged('options/privlyButton', enabled);
    return true;
  };

  /**
   * Whether content injection is enabled
   * @return {Boolean}
   */
  Privly.Options.isInjectionEnabled = function () {
    var v = ls.getItem('options/injection');
    if (v === undefined) {
      v = true;
    }
    return v;
  };

  /**
   * Enable or diable content injection
   * @param {Boolean} enabled
   */
  Privly.Options.setInjectionEnabled = function (enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('invalid argument');
    }
    ls.setItem('options/injection', enabled);
    optionChanged('options/injection', enabled);
    return true;
  };

  /**
   * Validates a FQDN
   * @param  {String}  domain Domain to validate
   * @return {Boolean}
   */
  Privly.Options.isWhitelistDomainValid = function (domain) {
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
  Privly.Options.getWhitelistDomains = function () {
    var v = ls.getItem('options/whitelist/domains');
    if (v === undefined) {
      v = [];
    }
    return v;
  };

  /**
   * Get user whitelist as RegExp
   * @return {[String]} Array of whitelists
   */
  Privly.Options.getWhitelistRegExp = function () {
    var v = ls.getItem('options/whitelist/regexp');
    if (v === undefined) {
      v = '';
    }
    return v;
  };

  /**
   * Update or set user whitelist
   * @param {String} whitelist
   */
  Privly.Options.setWhitelist = function (whitelist) {
    var regexp = ''; // stores regex to match validated domains
    var domains = whitelist.map(function (domain) {
      domain = domain.toLowerCase();
      regexp += '|' + domain.replace(/\./g, '\\.') + '\\\/';
      if (!Privly.Options.isWhitelistDomainValid(domain)) {
        throw new Error('invalid domain: ' + domain);
      }
      return domain;
    });

    ls.setItem('options/whitelist/domains', domains);
    optionChanged('options/whitelist/domains', domains);
    ls.setItem('options/whitelist/regexp', regexp);
    optionChanged('options/whitelist/regexp', regexp);
    return true;
  };

  /**
   * Get content server Url
   * @return {String}
   */
  Privly.Options.getServerUrl = function () {
    var v = ls.getItem('options/contentServer/url');
    if (v === undefined) {
      v = 'https://privlyalpha.org';
    }
    return v;
  };

  /**
   * Set content server Url
   * @param {String} url
   */
  Privly.Options.setServerUrl = function (url) {
    if (typeof url !== 'string') {
      throw new Error('invalid argument');
    }
    ls.setItem('options/contentServer/url', url);
    optionChanged('options/contentServer/url', url);
    return true;
  };

  /**
   * Get user glyph cells and color
   * @return {Object|undefined}
   *   {String} color
   *   {[Boolean]} cells
   */
  Privly.Options.getGlyph = function () {
    return ls.getItem('options/glyph');
  };

  /**
   * Set user glyph cells and color
   * @param {Object} glyph
   *   {String} color
   *   {[Boolean]} cells
   */
  Privly.Options.setGlyph = function (glyph) {
    if (typeof glyph !== 'object' || glyph === null) {
      throw new Error('invalid argument');
    }
    if (glyph.color === undefined || glyph.cells === undefined) {
      throw new Error('invalid argument');
    }
    var obj = {
      color: glyph.color,
      cells: glyph.cells
    };
    ls.setItem('options/glyph', obj);
    optionChanged('options/glyph', obj);
    return true;
  };


}());
