/**
 * @fileOverview Privly.glyph test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global describe, it, expect, beforeEach, spyOn */
/*global Privly */
describe('Privly.glyph', function () {

  beforeEach(function () {
    spyOn(Privly.options, 'getGlyph').and.callThrough();
    spyOn(Privly.options, 'setGlyph').and.callThrough();
  });

  it('getGlyph() calls Privly.options.getGlyph()', function () {
    Privly.glyph.getGlyph();
    expect(Privly.options.getGlyph).toHaveBeenCalled();
  });

  it('setGlyph() calls Privly.options.setGlyph()', function () {
    Privly.glyph.setGlyph({
      color: '112233',
      cells: [true, true, true, false, false, true, true, true, false, false, true, true, true, false, false]
    });
    expect(Privly.options.setGlyph).toHaveBeenCalled();
  });

  it('generateGlyph() can generate a new glyph', function () {
    Privly.glyph.generateGlyph();
    var oldGlyph = Privly.options.getGlyph();
    Privly.glyph.generateGlyph();
    var newGlyph = Privly.options.getGlyph();
    expect(newGlyph).not.toBeNull();
    expect(typeof newGlyph).toBe('object');
    expect(newGlyph.color).toBeDefined();
    expect(newGlyph.cells).toBeDefined();
    expect(newGlyph.cells.length).toBe(15);
    expect(oldGlyph.color).not.toEqual(newGlyph.color);
    expect(oldGlyph.cells).not.toEqual(newGlyph.cells);
  });

  it('getGlyphDOM() can generate glyph canvas DOM', function () {
    Privly.storage.remove('options/glyph');
    var canvas = Privly.glyph.getGlyphDOM(40);
    expect(canvas instanceof HTMLCanvasElement);
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, 40, 40);
    expect(data instanceof ImageData).toBe(true);
    expect(data.width).toBe(40);
    expect(data.height).toBe(40);
    // every cell should be 8*8
    // verify that each pixel in each cell contains the same color
    var cellMainColor = [];
    var row, col, i, j, ch, color, pos;
    for (row = 0; row < 5; ++row) {
      for (col = 0; col < 5; ++col) {
        pos = row * 8/*lines per row*/ * 40/*pixels per line*/ * 4/*channels per pixel*/ + col * 8/*pixels per col*/ * 4/*channels per pixel*/;
        color = data.data.subarray(pos, pos + 4);
        // convert to 0xAARRGGBB
        cellMainColor.push(((color[2] | color[1] << 8 | color[0] << 16 | color[3] << 24) >>> 0/*unsigned*/).toString(16));
        for (j = 0; j < 8; ++j) {
          for (i = 0; i < 8; ++i) {
            for (ch = 0; ch < 4; ++ch) {  // channel
              expect(data.data[row * 8 * 40 * 4 + j * 40 * 4 + col * 8 * 4 + i * 4 + ch]).toBe(color[ch]);
            }
          }
        }
      }
    }
    // verify cells
    var glyph = Privly.options.getGlyph();
    for (i = 0; i < 5; i++) {
      for (j = 0; j < 5; j++) {
        if (j <= 2) {
          if (!glyph.cells[i * 3 + j]) {
            expect(cellMainColor[i * 5 + j]).toBe('ffffffff');
          } else {
            expect(cellMainColor[i * 5 + j]).toBe('ff' + glyph.color);
          }
        } else {
          if (!glyph.cells[i * 3 + (5 % (j + 1))]) {
            expect(cellMainColor[i * 5 + j]).toBe('ffffffff');
          } else {
            expect(cellMainColor[i * 5 + j]).toBe('ff' + glyph.color);
          }
        }
      }
    }
  });

  it('initGlyph() creates a glyph when there is no glyph', function () {
    Privly.storage.remove('options/glyph');
    Privly.glyph.initGlyph();
    var glyph = Privly.glyph.getGlyph();
    expect(glyph).not.toBeNull();
    expect(glyph.color).not.toBeNull();
    expect(glyph.cells).not.toBeNull();
  });

  it('initGlyph() doesn\'t create a new glyph when there is a glyph', function () {
    Privly.glyph.generateGlyph();
    var glyph = Privly.glyph.getGlyph();
    Privly.glyph.initGlyph();
    expect(Privly.glyph.getGlyph()).toEqual(glyph);
  });

});
