/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Options Test Suite", function() {
  
  it("tests domain validation", function() {
    // Valid domains that should pass
    expect(Privly.options.isDomainValid('localhost')).toBe(true);
    expect(Privly.options.isDomainValid('localhost:3000')).toBe(true);
    expect(Privly.options.isDomainValid('example.com:3000')).toBe(true);
    expect(Privly.options.isDomainValid('example.example.com:3000')).toBe(true);
    expect(Privly.options.isDomainValid('example.example.example.com:3000')).toBe(true); 
  
    // Invalid domains that shouldn't pass
    expect(Privly.options.isDomainValid('.com:3000')).toBe(false); 
    expect(Privly.options.isDomainValid('locahost@')).toBe(false);
    expect(Privly.options.isDomainValid('inva!id.com')).toBe(false);
    expect(Privly.options.isDomainValid('l@calhost')).toBe(false);
    expect(Privly.options.isDomainValid('locahost:30o0')).toBe(false);
    expect(Privly.options.isDomainValid('.not.valid.com')).toBe(false);
    expect(Privly.options.isDomainValid('example.')).toBe(false);
    expect(Privly.options.isDomainValid('..example.com')).toBe(false);
    expect(Privly.options.isDomainValid('example..com')).toBe(false);
    expect(Privly.options.isDomainValid('example.com.')).toBe(false);
    expect(Privly.options.isDomainValid(' example.com')).toBe(false);
    expect(Privly.options.isDomainValid('example.com ')).toBe(false);
    expect(Privly.options.isDomainValid('/path/but/not/domain/')).toBe(false);
    expect(Privly.options.isDomainValid(' ')).toBe(false);
    expect(Privly.options.isDomainValid('the quick brown fox jumps over the lazy dog')).toBe(false);
  });

  // TODO: add more unit tests
  
});
