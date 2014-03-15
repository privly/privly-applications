// JS Test
// Tests can be loaded here and be executed with jasmine-node spec/
// However, there is no window or other variables that are often available
// for the browser.

"use strict";

var fs = require("fs");
var vm = require("vm");
var os = require("os");

function include(path) {
    var code = fs.readFileSync(path, 'utf-8');
    vm.runInThisContext(code, path);
}

if (typeof(require) == "function") {
  include("shared/javascripts/extension_integration.js");
  include("shared/javascripts/host_page_integration.js");
  include("shared/javascripts/meta_loader.js");
  include("shared/javascripts/network_service.js");
  include("shared/javascripts/network_service.js");
  include("shared/javascripts/parameters.js");
  include("shared/javascripts/tooltip.js");
}

if (typeof (location) !== "undefined") {
  include("PlainPost/js/new.js");
  include("PlainPost/test/new.js");
}

