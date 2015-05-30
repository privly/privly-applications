/**
 * @fileOverview This file provides user glyph related functionalities and interfaces.
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
   * @return {Node} A table element containing the glyph.
   *
   */
  Privly.glyph.getGlyphDOM = function () {
    // Generate a new glyph if not exist
    var glyph = Privly.options.getGlyph();
    if (glyph === null) {
      glyph = Privly.glyph.generateGlyph();
    }

    // Construct the 5x5 table that will represent the glyph.
    // Its 3rd column is the axis of symmetry
    var table = document.createElement('table');
    table.setAttribute('class', 'glyph_table');
    table.setAttribute('dir', 'ltr');
    table.setAttribute('width', '30');
    table.setAttribute('border', '0');
    table.setAttribute('summary', 'Privly Visual Security Glyph');

    var tbody = document.createElement('tbody');
    var i, j, tr, td, nbs;

    for (i = 0; i < 5; i++) {
      tr = document.createElement('tr');
      for (j = 0; j < 5; j++) {
        td = document.createElement('td');

        // Add a non-breaking space
        nbs = document.createTextNode('\u00A0');
        td.appendChild(nbs);

        // Fill only the first three columns with the coresponding values from glyphArray[]
        // The rest of two columns are simetrical to the first two
        if (j <= 2) {
          if (glyph.cells[i * 3 + j]) {
            td.setAttribute('class', 'glyph_fill');
            td.setAttribute('style', 'background-color:#' + glyph.color);
          } else {
            td.setAttribute('class', 'glyph_empty');
          }
        } else {
          if (glyph.cells[i * 3 + (5 % (j + 1))]) {
            td.setAttribute('class', 'glyph_fill');
            td.setAttribute('style', 'background-color:#' + glyph.color);
          } else {
            td.setAttribute('class', 'glyph_empty');
          }
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
  };

}());
