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
      {id: "server_status", type: "div"},
      {id: "whitelist_url", type: "input", class: "whitelist_url", value: "example.org"},
      {id: "remove_whitelist", type: "div"},
      {id: "urls", type: "div"}
    ];
    domIDs.forEach(function(ob){
      var newElement = $('<' + ob.type + '/>', {
        id: ob.id,
        class: ob.class,
        value: ob.value
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
    var glyph = ls.getItem("options/glyph");
    regenerateGlyph();
    var glyph2 = ls.getItem("options/glyph");
    expect(glyph.color).not.toEqual(glyph2.color);
    var patternDifference = false;
    for( var i = 0; i < 15; i++ ) {
      patternDifference = patternDifference
        || glyph.cells[i] !== glyph2.cells[i];
    }
    expect(patternDifference).toBe(true);
  });

  it("saves settings from UI", function() {
    ls.setItem("Options:DissableButton", "tmp");
    document.querySelector("#disableBtn").checked = true;
    saveCheckedSetting();
    var status = document.getElementById("button_status");
    expect(status.innerHTML).toBe("Setting Saved.");
    expect(ls.getItem("options/privlyButton")).toBe(false);
  });

  it("restores checked settings", function() {
    var btn = document.getElementById("disableBtn");

    // Dissables button
    ls.setItem("options/privlyButton", false);
    restoreCheckedSetting();
    expect(btn.checked).toBe(true);

    // Enables button
    ls.setItem("options/privlyButton", true);
    restoreCheckedSetting();
    expect(btn.checked).toBe(false);
  });

  it("saves empty whitelist", function() {
    $("#whitelist_url").remove();
    saveWhitelist();
    var status = document.getElementById("status");
    expect(status.innerHTML).toBe("Options Saved.");
    expect(ls.getItem("options/whitelist/domains").length).toBe(0);
    expect(ls.getItem("options/whitelist/regexp")).toBe("");
  });

  it("saves example.org for whitelist", function() {
    saveWhitelist();
    var status = document.getElementById("status");
    expect(status.innerHTML).toBe("Options Saved.");
    expect(ls.getItem("options/whitelist/domains").length).toBe(1);
    expect(ls.getItem("options/whitelist/domains")[0]).toBe("example.org");
    expect(ls.getItem("options/whitelist/regexp")).toBe("|example\\.org\\/");
  });

  it("restore whitelist does not result in an error", function() {

    // todo, the storage for this function is about to change, so
    // I am not going to write the storage checks yet.
    restoreWhitelist();
  });

  it("restores the content server to alpha", function() {
    ls.removeItem("posting_content_server_url");
    restoreServer();
    expect(ls.getItem("posting_content_server_url"), "https://privlyalpha.org");
  });

  it("saves the content server", function() {

    ls.removeItem("options/contentServer/url")

    Privly.options.setServerUrl("http://localhost:3000");
    expect(ls.getItem("options/contentServer/url")).toBe("http://localhost:3000");

    Privly.options.setServerUrl("https://privlyalpha.org");
    expect(ls.getItem("options/contentServer/url")).toBe("https://privlyalpha.org");

    Privly.options.setServerUrl("https://dev.privly.org");
    expect(ls.getItem("options/contentServer/url")).toBe("https://dev.privly.org");

    Privly.options.setServerUrl("https://custom.org");
    expect(ls.getItem("options/contentServer/url")).toBe("https://custom.org");
  });

  it("tests domain validation", function() {

    var validDomains = [
      'localhost',
      'localhost:3000',
      'example.com:3000',
      'example.example.com:3000',
      'example.example.example.com:3000'
    ];

    // Valid domains that should pass
    validDomains.forEach(function(d){
      expect(Privly.options.isDomainValid(d)).toBe(true);
    });

    var invalidDomains = [
      '.com:3000',
      'locahost@',
      'inva!id.com',
      'l@calhost',
      'locahost:30o0',
      '.not.valid.com',
      'example.',
      '..example.com',
      'example..com',
      'example.com.',
      ' example.com',
      'example.com ',
      '/path/but/not/domain/',
      ' ',
      'the quick brown fox jumps over the lazy dog'
    ];
    // Invalid domains that shouldn't pass
    invalidDomains.forEach(function(d){
      expect(Privly.options.isDomainValid(d)).toBe(false);
    });
  });

  it('saves the server', function () {
    var ev = {target: {value: ""}};
    saveServer(ev);
    expect($("#user").css("display")).toBe("none");
    ev.target.value = "save_server";
    var server = document.getElementById("content_server_url");
    server.value = "other";
    var sham = "https://sham.com";
    document.getElementById("other_content_server").value = sham;
    saveServer(ev);
    var cur = Privly.options.getServerUrl();
    expect(cur).toBe(sham);
    server.value = "alpha";
    saveServer(ev);
    cur = Privly.options.getServerUrl();
    expect(cur).toBe("https://privlyalpha.org");
    server.value = "dev";
    saveServer(ev);
    cur = Privly.options.getServerUrl();
    expect(cur).toBe("https://dev.privly.org");
    server.value = "local";
    saveServer(ev);
    cur = Privly.options.getServerUrl();
    expect(cur).toBe("http://localhost:3000");
  });

  it('does not result in an error when restoring the server', function () {
    // todo, refactor the script being tested
    Privly.options.setServerUrl("https://privlyalpha.org");
    restoreServer();
    Privly.options.setServerUrl("https://dev.privly.org");
    restoreServer();
    Privly.options.setServerUrl("http://localhost:3000");
    restoreServer();
    Privly.options.setServerUrl("http://other.com");
    restoreServer();
  });

  it('tests initialize app function', function () {

    // add logout_link to DOM so init function does not return immediately
    var ob =  {id: "logout_link", type: "a", class: "logout_url"};
    var newElement = $('<' + ob.type + '/>', {
      id: ob.id,
      class: ob.class,
      value: ob.value
    });
    $(document.body).append(newElement);

    spyOn(privlyNetworkService, 'initializeNavigation').and.stub();
    spyOn(privlyNetworkService, 'initPrivlyService').and.stub();
    spyOn(window, 'restoreCheckedSetting').and.callThrough();
    spyOn(window, 'restoreWhitelist').and.callThrough();
    spyOn(window, 'restoreServer').and.callThrough();
    spyOn(window, 'listeners').and.stub(); // mock because depends on DOM elements
    spyOn(window, 'writeGlyph').and.callThrough();

    initializeApp();

    expect(privlyNetworkService.initializeNavigation).toHaveBeenCalled();
    expect(privlyNetworkService.initPrivlyService).toHaveBeenCalled();
    expect(restoreCheckedSetting).toHaveBeenCalled();
    expect(restoreWhitelist).toHaveBeenCalled();
    expect(restoreServer).toHaveBeenCalled();
    expect(listeners).toHaveBeenCalled();
    expect(writeGlyph).toHaveBeenCalled();
  });
});
