/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Options Test Suite", function() {
  
  it("tests domain validation", function() {
    // Valid domains that should pass
    expect(Privly.Options.isWhitelistDomainValid('localhost')).toBe(true);
    expect(Privly.Options.isWhitelistDomainValid('localhost:3000')).toBe(true);
    expect(Privly.Options.isWhitelistDomainValid('example.com:3000')).toBe(true);
    expect(Privly.Options.isWhitelistDomainValid('example.example.com:3000')).toBe(true);
    expect(Privly.Options.isWhitelistDomainValid('example.example.example.com:3000')).toBe(true); 
  
    // Invalid domains that shouldn't pass
    expect(Privly.Options.isWhitelistDomainValid('.com:3000')).toBe(false); 
    expect(Privly.Options.isWhitelistDomainValid('locahost@')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('inva!id.com')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('l@calhost')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('locahost:30o0')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('.not.valid.com')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('example.')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('..example.com')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('example..com')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('example.com.')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid(' example.com')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('example.com ')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('/path/but/not/domain/')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid(' ')).toBe(false);
    expect(Privly.Options.isWhitelistDomainValid('the quick brown fox jumps over the lazy dog')).toBe(false);
  });

  // TODO: add more unit tests
  
});
