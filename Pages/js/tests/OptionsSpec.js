/**
 * @fileOverview tests.js Gives testing code for the options page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Options Suite", function() {

  beforeEach(function() {
    var domIDs = [
      {id: "button_status", type: "div"},
      {id: "disableBtn", type: "input"},
      {id: "status", type: "div"},
      {id: "glyph_div", type: "div"},
      {id: "invalid_domain", type: "div"},
      {id: "server_form", type: "input"},
      {id: "content_server_url", type: "input"},
      {id: "user", type: "input"},
      {id: "other_content_server", type: "input"},
      {id: "server_status", type: "div"}
    ];
    domIDs.forEach(function(ob){
      var newElement = $('<' + ob.type + '/>', {
        id: ob.id
      });
      $(document.body).append(newElement);
    });
  });

  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("tests writeability of glyph", function() {
    writeGlyph();
    expect(document.getElementById("glyph_div").children.length).toEqual(1);
  });

  it("tests generation of new glyph", function() {
    var oldColor = ls.getItem("glyph_color");
    var oldGlyph = ls.getItem("glyph_cells");
    regenerateGlyph();
    expect(oldColor).not.toEqual(ls.getItem("glyph_color"));
    expect(oldGlyph).not.toEqual(ls.getItem("glyph_cells"));
  });

  it("saves settings from UI", function() {

    ls.setItem("Options:DissableButton", "tmp");

    saveCheckedSetting();

    var status = document.getElementById("button_status");
    expect(status.innerHTML).toBe("Setting Saved.");

    document.querySelector("#disableBtn").checked = true;
    expect(ls.getItem("Options:DissableButton")).toBe(false);
  });

  it("restores checked settings", function() {
    var btn = document.getElementById("disableBtn");

    // Dissables button
    ls.setItem("Options:DissableButton", true);
    restoreCheckedSetting();
    expect(btn.checked).toBe(true);

    // Enables button
    ls.setItem("Options:DissableButton", false);
    restoreCheckedSetting();
    expect(btn.checked).toBe(false);
  });

  it("saves empty whitelist", function() {
    saveWhitelist();
    var status = document.getElementById("status");
    expect(status.innerHTML).toBe("Options Saved.");
    expect(ls.getItem("user_whitelist_json").length).toBe(0);
  });

  it("restore whitelist does not result in an error", function() {
    // todo, the storage for this function is about to change, so
    // I am not going to write the storage checks yet.
    restoreWhitelist();
  });

  it("restores the content server", function() {

    ls.removeItem("posting_content_server_url");
    restoreServer();
    expect(ls.getItem("posting_content_server_url"), "https://privlyalpha.org");

    ls.setItem("posting_content_server_url", "https://privlyalpha.org");
    expect(ls.getItem("posting_content_server_url"), "https://privlyalpha.org");

    ls.setItem("posting_content_server_url", "https://custom.org");
    expect(ls.getItem("posting_content_server_url"), "https://custom.org");

    ls.setItem("posting_content_server_url", "https://dev.privly.org");
    expect(ls.getItem("posting_content_server_url"), "https://dev.privly.org");

    ls.setItem("posting_content_server_url", "http://localhost:3000");
    expect(ls.getItem("posting_content_server_url"), "http://localhost:3000");

  });

  it("saves the content server", function() {

    ls.removeItem("posting_content_server_url")

    var elem = document.getElementById("content_server_url");

    elem.value = "local";
    saveServer({target: {value:"save_server"}});
    expect(ls.getItem("posting_content_server_url")).toBe("http://localhost:3000");

    elem.value = "alpha";
    saveServer({target: {value:"save_server"}});
    expect(ls.getItem("posting_content_server_url")).toBe("https://privlyalpha.org");

    elem.value = "dev";
    saveServer({target: {value:"save_server"}});
    expect(ls.getItem("posting_content_server_url")).toBe("https://dev.privly.org");

    elem.value = "other";
    document.getElementById("other_content_server").value = "https://custom.org";
    saveServer({target: {value:"save_server"}});
    expect(ls.getItem("posting_content_server_url")).toBe("https://custom.org");
  });

  it("tests domain validation", function() {
    // Valid domains that should pass
    expect(isValidDomain('localhost')).toBe(true);
    expect(isValidDomain('localhost:3000')).toBe(true);
    expect(isValidDomain('example.com:3000')).toBe(true);
    expect(isValidDomain('example.example.com:3000')).toBe(true);
    expect(isValidDomain('example.example.example.com:3000')).toBe(true); 
  
    // Invalid domains that shouldn't pass
    expect(isValidDomain('.com:3000')).toBe(false); 
    expect(isValidDomain('locahost@')).toBe(false);
    expect(isValidDomain('inva!id.com')).toBe(false);
    expect(isValidDomain('l@calhost')).toBe(false);
    expect(isValidDomain('locahost:30o0')).toBe(false);
    expect(isValidDomain('.not.valid.com')).toBe(false);
    expect(isValidDomain('example.')).toBe(false);
    expect(isValidDomain('..example.com')).toBe(false);
    expect(isValidDomain('example..com')).toBe(false);
    expect(isValidDomain('example.com.')).toBe(false);
    expect(isValidDomain(' example.com')).toBe(false);
    expect(isValidDomain('example.com ')).toBe(false);
    expect(isValidDomain('/path/but/not/domain/')).toBe(false);
    expect(isValidDomain(' ')).toBe(false);
    expect(isValidDomain('the quick brown fox jumps over the lazy dog')).toBe(false);

  });

});
