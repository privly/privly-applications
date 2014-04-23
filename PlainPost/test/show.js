/**
 * @fileOverview tests.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/

describe ("PlainPost Show Suite", function() {

  it("We shoild have jsonURL", function() {
    expect(state.jsonURL).toBe(window.location.href);
  });

});
