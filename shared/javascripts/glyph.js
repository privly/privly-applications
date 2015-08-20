/**
 * @fileOverview This file provides user glyph related functionalities and interfaces.
 *
 * To get the current user glyph:
 *
 *    Privly.glyph.getGlyph()
 *
 *    User glyph will be returned as a return value, which is an object containing
 *    `color` property and `cells` property. If the user does not have a glyph, the
 *    function will return null.
 *
 * To set a glyph:
 *
 *    Privly.glyph.setGlyph(glyph)
 *
 *    For developers, normally you needn't call this function.
 *
 * To get the glyph DOM element of the current user:
 *
 *    Privly.glyph.getGlyphDOM()
 *
 *    A `canvas` node will be returned.
 *
 * To regenerate a new glyph for the current user:
 *
 *    Privly.glyph.generateGlyph()
 *
 *    The new glyph will be returned.
 * 
 */
/*global chrome */
/*global Privly:true */

// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}

(function () {

  // If this file is already loaded, don't do it again
  if (Privly.glyph !== undefined) {
    return;
  }
  Privly.glyph = {};

  // CommonJS Module
  if (typeof module !== "undefined" && module.exports) {
    // load dependencies    
    var optionsModule = require("./options.js");
    Privly.options = optionsModule.options;
    // export interfaces
    module.exports.glyph = Privly.glyph;
    module.exports.options = optionsModule.options;
    module.exports.storage = optionsModule.storage;
    module.exports.message = optionsModule.message;
  }

  /**
   * Get glyph color and cells
   */
  Privly.glyph.getGlyph = function () {
    return Privly.options.getGlyph();
  };

  /**
   * Set glyph color and cells
   */
  Privly.glyph.setGlyph = function (glyph) {
    return Privly.options.setGlyph(glyph);
  };

  /**
   * Initialize a new glyph image if not exist
   */
  Privly.glyph.initGlyph = function () {
    if (Privly.glyph.getGlyph() === null) {
      Privly.glyph.generateGlyph();
    }
  };


  // If this script is running as a background script
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getBackgroundPage) {
    // Set event listeners to execute initGlyph() function when
    // the extension got installed.
    chrome.runtime.onInstalled.addListener(function () {
      Privly.glyph.initGlyph();
    });
  }

  /**
   * Generate a not-too-dark and not-too-bright color component.
   * Range: 0x50 ~ 0xA0
   * @return {String} The color component in hex
   */
  function getRandomColorComponent() {
    return (Math.floor(Math.random() * (0xA0 - 0x50)) + 0x50).toString(16);
  }

  /**
   * Re-generate a new glyph and store it
   */
  Privly.glyph.generateGlyph = function () {
    var glyphColor = getRandomColorComponent() + getRandomColorComponent() + getRandomColorComponent();
    var glyphCells = [];
    var i;
    for (i = 0; i < 15; i++) {
      glyphCells.push((Math.random() < 0.5) ? false : true);
    }
    var newGlyph = {
      color: glyphColor,
      cells: glyphCells
    };
    Privly.options.setGlyph(newGlyph);
    return newGlyph;
  };

  /**
   * Constructs the user's security glyph, which indicates whether the
   * injected content is trusted.
   *
   * @param {int} size The width and height of the image
   * @return {Node} A canvas element containing the glyph.
   */
  Privly.glyph.getGlyphDOM = function (size) {
    if (size === undefined) {
      size = 30;
    }
    // Generate a new glyph if not exist
    var glyph = Privly.options.getGlyph();
    if (glyph === null) {
      glyph = Privly.glyph.generateGlyph();
    }

    var cellSize = Math.floor(size / 5);
    var realSize = cellSize * 5;
    var offset = Math.floor((size - realSize) / 2);

    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // draw background
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, size, size);

    // draw pattern
    ctx.fillStyle = '#' + glyph.color;

    var i, j;

    for (i = 0; i < 5; i++) {
      for (j = 0; j < 5; j++) {
        // Fill only the first three columns with the coresponding values from glyph.cells[]
        // The rest of two columns are simetrical to the first two
        if (j <= 2) {
          if (glyph.cells[i * 3 + j]) {
            ctx.fillRect(offset + j * cellSize, offset + i * cellSize, cellSize, cellSize);
          }
        } else {
          if (glyph.cells[i * 3 + (5 % (j + 1))]) {
            ctx.fillRect(offset + j * cellSize, offset + i * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    return canvas;
  };

}());
