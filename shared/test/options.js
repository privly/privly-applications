/**
 * @fileOverview Privly.options test case.
 * This spec is managed by the Jasmine testing library.
 **/
/*global jasmine, describe, it, expect */
/*global Privly, ls */
describe('Privly.options', function () {

  it('isDomainValid() should validate FQDN', function () {
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

  it('upgrade() should upgrade old options', function () {
    ls.setItem('Options:DissableButton', false);
    Privly.options.upgrade();
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(true);
    expect(ls.getItem('Options:DissableButton')).not.toBeDefined();

    ls.setItem('Options:DissableButton', true);
    Privly.options.upgrade();
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(false);
    expect(ls.getItem('Options:DissableButton')).not.toBeDefined();

    ls.setItem('user_whitelist_csv', 'example.com,google.com,facebook.com');
    Privly.options.upgrade();
    expect(Privly.options.getWhitelistDomains()).toEqual(['example.com', 'google.com', 'facebook.com']);
    expect(ls.getItem('user_whitelist_csv')).not.toBeDefined();

    ls.removeItem('user_whitelist_csv');
    ls.setItem('user_whitelist_json', '["github.com", "plus.google.com", "twitter.com"]');
    Privly.options.upgrade();
    expect(Privly.options.getWhitelistDomains()).toEqual(['github.com', 'plus.google.com', 'twitter.com']);
    expect(ls.getItem('user_whitelist_json')).not.toBeDefined();

    ls.setItem('posting_content_server_url', 'https://privly.example.com');
    Privly.options.upgrade();
    expect(Privly.options.getServerUrl()).toBe('https://privly.example.com');
    expect(ls.getItem('posting_content_server_url')).not.toBeDefined();

    ls.setItem('glyph_color', '001122');
    ls.setItem('glyph_cell', 'true,true,false,true,false,true,false,false,false,true,false,true,false,true,false');
    Privly.options.upgrade();
    var glyph = Privly.options.getGlyph();
    expect(glyph).toEqual(jasmine.any(Object));
    expect(glyph.color).toBe('001122');
    expect(glyph.cells).toEqual([true, true, false, true, false, true, false, false, false, true, false, true, false, true, false]);
    expect(ls.getItem('glyph_color')).not.toBeDefined();
    expect(ls.getItem('glyph_cell')).not.toBeDefined();
  });

  it('upgrade() should not change existing options if there are no old options', function () {
    Privly.options.setPrivlyButtonEnabled(true);
    ls.removeItem('Options:DissableButton');
    Privly.options.upgrade();
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(true);

    Privly.options.setPrivlyButtonEnabled(false);
    ls.removeItem('Options:DissableButton');
    Privly.options.upgrade();
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(false);
  });

  it('isPrivlyButtonEnabled() defaults to false', function () {
    Privly.storage.remove('options/privlyButton');
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(false);
  });

  it('isPrivlyButtonEnabled() works', function () {
    Privly.storage.set('options/privlyButton', true);
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(true);
    Privly.storage.set('options/privlyButton', false);
    expect(Privly.options.isPrivlyButtonEnabled()).toBe(false);
  });

  it('setPrivlyButtonEnabled() works', function () {
    Privly.options.setPrivlyButtonEnabled(false);
    expect(Privly.storage.get('options/privlyButton')).toBe(false);
    Privly.options.setPrivlyButtonEnabled(true);
    expect(Privly.storage.get('options/privlyButton')).toBe(true);
    // test exceptions
    expect(function () { Privly.options.setPrivlyButtonEnabled('123'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled('true'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled('false'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled('boolean'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled(''); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled(0); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled(1); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled(null); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setPrivlyButtonEnabled(undefined); }).toThrow(new Error('invalid argument'));
  });

  it('isInjectionEnabled() defaults to true', function () {
    Privly.storage.remove('options/injection');
    expect(Privly.options.isInjectionEnabled()).toBe(true);
  });

  it('isInjectionEnabled() works', function () {
    Privly.storage.set('options/injection', true);
    expect(Privly.options.isInjectionEnabled()).toBe(true);
    Privly.storage.set('options/injection', false);
    expect(Privly.options.isInjectionEnabled()).toBe(false);
  });

  it('setInjectionEnabled() works', function () {
    Privly.options.setInjectionEnabled(false);
    expect(Privly.storage.get('options/injection')).toBe(false);
    Privly.options.setInjectionEnabled(true);
    expect(Privly.storage.get('options/injection')).toBe(true);
    // test exceptions
    expect(function () { Privly.options.setInjectionEnabled('123'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled('true'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled('false'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled('boolean'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled(''); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled(0); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled(1); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled(null); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setInjectionEnabled(undefined); }).toThrow(new Error('invalid argument'));
  });

  it('getWhitelistDomains() defaults to empty array', function () {
    Privly.storage.remove('options/whitelist/domains');
    expect(Privly.options.getWhitelistDomains()).toEqual([]);
  });

  it('getWhitelistRegExp() defaults to empty string', function () {
    Privly.storage.remove('options/whitelist/regexp');
    expect(Privly.options.getWhitelistRegExp()).toBe('');
  });

  it('setWhitelist() works', function () {
    Privly.options.setWhitelist(['facebook.com', 'twitter.com', 'my-example.com']);
    expect(Privly.options.getWhitelistDomains()).toEqual(['facebook.com', 'twitter.com', 'my-example.com']);
    expect(Privly.options.getWhitelistRegExp()).toBe('|facebook\\.com\\/|twitter\\.com\\/|my-example\\.com\\/');
    Privly.options.setWhitelist([]);
    expect(Privly.options.getWhitelistDomains()).toEqual([]);
    expect(Privly.options.getWhitelistRegExp()).toBe('');
    Privly.options.setWhitelist(['UPCAse-doMAIN.com']);
    expect(Privly.options.getWhitelistDomains()).toEqual(['upcase-domain.com']);
    expect(Privly.options.getWhitelistRegExp()).toBe('|upcase-domain\\.com\\/');
    // test exceptions
    expect(function () { Privly.options.setWhitelist(['1.']); }).toThrow(new Error('invalid domain'));
    expect(function () { Privly.options.setWhitelist(['facebook.com', 'a.']); }).toThrow(new Error('invalid domain'));
    expect(function () { Privly.options.setWhitelist(['x.:3000', 'facebook.com']); }).toThrow(new Error('invalid domain'));
    expect(function () { Privly.options.setWhitelist(null); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist(undefined); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist('facebook.com'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist(false); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist([1]); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist(['facebook.com', 1]); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist(['facebook.com', false]); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setWhitelist([true, 'facebook.com']); }).toThrow(new Error('invalid argument'));
  });

  it('getServerUrl() defaults to https://privlyalpha.org', function () {
    Privly.storage.remove('options/contentServer/url');
    expect(Privly.options.getServerUrl()).toBe('https://privlyalpha.org');
  });

  it('getServerUrl() works', function () {
    Privly.storage.set('options/contentServer/url', 'https://localhost:3000');
    expect(Privly.options.getServerUrl()).toBe('https://localhost:3000');
    Privly.storage.set('options/contentServer/url', 'http://example.com');
    expect(Privly.options.getServerUrl()).toBe('http://example.com');
  });

  it('setServerUrl() works', function () {
    Privly.options.setServerUrl('https://localhost:3000');
    expect(Privly.storage.get('options/contentServer/url')).toBe('https://localhost:3000');
    Privly.options.setServerUrl('http://example.com');
    expect(Privly.storage.get('options/contentServer/url')).toBe('http://example.com');
    // test exceptions
    expect(function () { Privly.options.setServerUrl(true); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setServerUrl(123); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setServerUrl(['http://localhost.com']); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setServerUrl(null); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setServerUrl(undefined); }).toThrow(new Error('invalid argument'));
  });

  it('getGlyph() defaults to null', function () {
    Privly.storage.remove('options/glyph');
    expect(Privly.options.getGlyph()).toBeNull();
  });

  it('getGlyph() works', function () {
    var glyph = {
      color: '334455',
      cells: [true, true, true, true, false, false, true, true, true, false, false, true, true, false, true]
    };
    Privly.storage.set('options/glyph', glyph);
    expect(Privly.options.getGlyph()).toEqual(glyph);
  });

  it('setGlyph() works', function () {
    var glyph = {
      color: '334455',
      cells: [true, true, true, true, false, false, true, true, true, false, false, true, true, false, true]
    };
    Privly.options.setGlyph(glyph);
    expect(Privly.storage.get('options/glyph')).toEqual(glyph);
    var glyphWithExtraProperty = {
      color: '334455',
      cells: [true, true, true, true, false, false, true, true, true, false, false, true, true, false, true],
      extra: 'hello_world!'
    };
    Privly.options.setGlyph(glyphWithExtraProperty);
    expect(Privly.storage.get('options/glyph')).toEqual(glyph);
    // test exceptions
    expect(function () { Privly.options.setGlyph(null); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({}); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph('{}'); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({color: null, cells: null}); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({color: 123, cells: []}); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({color: false, cells: []}); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({color: [], cells: []}); }).toThrow(new Error('invalid argument'));
    expect(function () { Privly.options.setGlyph({color: '123123', cells: null}); }).toThrow(new Error('invalid argument'));
  });

});
