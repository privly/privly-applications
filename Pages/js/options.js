/**
 * @fileOverview options.js loads options from local storage to
 * initialize forms, and saves updates to the options.
 *
 * Available options include setting the some-trust whitelisted domains 
 * and the server the user uploads their content to when generating new
 * injectable links.
 *
 * For more information about the whitelist, read:
 * https://github.com/privly/privly-organization/wiki/whitelist
 *
 * Local Storage Bindings Used:
 *
 * - user_whitelist_json: This is an array of servers the user can provide
 *   to specify which servers they trust to automatically inject into the host
 *   page. This array is presented to the user every time they visit options,
 *   but the string used by the content script is user_whitelist_regexp.
 *
 * - user_whitelist_regexp: This string is formatted specifically so that 
 *   privly.js can update its whitelist regexp.
 *
 * - posting_content_server_url: The content server the user will post to
 *   when generating new content.
 *
 * - privly_glyph: A consistent visual identifier to prevent spoofing.
 *   It is stored as series of hex colors stated
 *   without the leading hash sign, and separated by commas. 
 *   eg: ffffff,f0f0f0,3f3f3f
 *
 */
/* jshint undef: true, unused: true */
/* global ls */

/**
 * Saves user's setting to disable Privly button appearance
 */
function saveCheckedSetting() {

  // Don't run on Firefox
  var status = document.getElementById("button_status");
  if (status === null ) {return;}

  // reset status
  status.innerHTML = "";

  var checkedState = document.querySelector("#disableBtn").checked;
  ls.setItem("Options:DissableButton", checkedState);

  status.innerHTML = "Setting Saved."; 
}

/**
 * Restores user's setting to disable Privly button appearance
 */
function restoreCheckedSetting() {
  var btn = document.getElementById("disableBtn");
  if ( btn === null ) {return;} // Don't run on Firefox
  var stored = ls.getItem("Options:DissableButton");
  btn.checked = (stored !== undefined && stored === true);

  // Save the current setting for the Privly button appearance
  btn.addEventListener('click', saveCheckedSetting);
}

/** 
 * Validates a FQDN
 */
function isValidDomain(domain) {
  // Each subdomain can be from 1-63 characters and may contain alphanumeric
  // characters, - and _ but may not begin or end with - or _
  // Each domain can be from 1-63 characters and may contain alphanumeric 
  // characters and - but may not begin or end with - Each top level domain may
  // be from 2 to 9 characters and may contain alpha characters
  var validateSubdomain = /^(?!\-|_)[\w\-]{1,63}/g; //subdomains
  var validateDomain = /^(?!\-)[a-zA-Z0-9\-?]{1,63}$/g; //domain
  var validateDomainAndPort = /^(?!\-)[a-zA-Z0-9\-?]{1,63}(?::\d+)?$/g; 
  var validateTLD = /^[a-zA-Z]{2,9}(?::\d+)?$/g; //top level domain
  
  //needed because js regex does not have look-behind
  var notEndInHyphenOrUnder = /[^\-_]$/g; 
  var notEndInHyphen = /[^\-]$/g;

  var parts = domain.split(".");
  var valid_parts_count = 0;

  //iterate over domains, split by .
  for (var j = 0; j < parts.length; j++) {
    switch (j){
    case parts.length-1: // validate TLD or Domain if no TLD present
      if (parts.length == 1) {
        if (parts[j].match(validateDomainAndPort)) 
          valid_parts_count++;
      } else {
        if (parts[j].match(validateTLD))
          valid_parts_count++;
      } 
      break;
    case parts.length-2: // validate Domain
      if (parts[j].match(validateDomain) &&
          parts[j].match(notEndInHyphen)) {
        valid_parts_count++;
      }
      break;
    default: // validate Subdomain(s)
      if (parts[j].match(validateSubdomain) &&
          parts[j].match(notEndInHyphenOrUnder)) {
        valid_parts_count++;
      }
      break;
    }
  }

  //if all parts of domain are valid
  //append to regex for restricting domains of injected content
  return valid_parts_count === parts.length;
}

/**
 * Saves user's custom whitelist to local storage.
 */
function saveWhitelist() {
  var inputs = []; // Stores whitelist inputs and whitelisted values
  var url_inputs = document.getElementsByClassName('whitelist_url');
  for(var i = 0; i < url_inputs.length ; i++ ){
    url_inputs[i].className = "whitelist_url form-control"; // remove error class
    if(url_inputs[i].value.length > 0) {
      inputs.push({
          // remove any leading protocol and invalid characters
          domain:  url_inputs[i].value.replace(/ /g, "")
                                      .replace(/[^a-zA-Z0-9\-:._]/g, ""),
          input: url_inputs[i] // save input for later use
      });
    }
  }

  var domains = []; // stores valid domains
  var domain_regexp = "";  // stores regex to match validated domains

  var invalid_domains = false;
  var invalid_domain = document.getElementById('invalid_domain');
  invalid_domain.className = ''; // hide the error message

  //iterate over entered list, split by invalid chars
  for (i = 0; i < inputs.length; i++) {
    if (isValidDomain(inputs[i].domain)) {
      domain_regexp += ("|" + inputs[i].domain.toLowerCase().replace(/\./g, "\\.") + "\\\/");
      domains.push(inputs[i].domain.toLowerCase());
    } else {
      inputs[i].input.className += " invalid-domain";
      invalid_domains = true;
    }
  }
  if (invalid_domains) {
    invalid_domain.className = 'show';
  } else {
    ls.setItem("user_whitelist_json", JSON.stringify(domains));
    ls.setItem("user_whitelist_regexp", domain_regexp);

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
      status.innerHTML = "";
    }, 1000);
  }
}


/**
 * Restores select box state to saved value from local storage.
 */
function restoreWhitelist() {

  // Legacy CSV check
  var user_whitelist_csv = ls.getItem("user_whitelist_csv");
  if (user_whitelist_csv) {
    ls.setItem("user_whitelist_json", JSON.stringify(user_whitelist_csv.split(',')));
    ls.removeItem("user_whitelist_csv");
  }

  var user_whitelist = ls.getItem("user_whitelist_json");
  if (!user_whitelist)
      return;
  for (var i = 0 ; i <= user_whitelist.length - 1 ; i++) {
    addUrlInputs();
  }
  var inputs = document.getElementsByClassName("whitelist_url");
  var removals = document.getElementsByClassName("remove_whitelist");

  // Replaces trailing whitespaces, if any
  for (i=0; i< user_whitelist.length; i++) {
    inputs[i].value = user_whitelist[i];
    removals[i].setAttribute("data-value-to-remove", user_whitelist[i]);
  }
}


/**
 * Restores the current content server setting.
 */
function restoreServer(){
  
  var posting_content_server_url = ls.getItem("posting_content_server_url");
  var server_input = document.getElementById("content_server_url");
  
  // check content server
  if (!posting_content_server_url) {
    ls.setItem("posting_content_server_url", "https://privlyalpha.org");
  }
    
   // check content type and restore
  switch(posting_content_server_url){

    //diplay the on menu
    case "https://privlyalpha.org":
      var alpha_input = document.getElementById("server_form");
      alpha_input.style.display = "block";
      server_input.selectedIndex = 0;
      break;

    // display the on menu
    case "https://dev.privly.org":
      var dev_input = document.getElementById("server_form");
      dev_input.style.display = "block";
      server_input.selectedIndex = 1;
      break;

    // diplay the on menu
    case "http://localhost:3000":
      var local_input = document.getElementById("server_form");
      local_input.style.display = "block";
      server_input.selectedIndex = 2;
      break;

    // user defined data
    default:
      var other_input = document.getElementById("server_form"); // diplay the on menu
      other_input.style.display = "block";

      // diplay the other sub menu
      var user_input = document.getElementById("user");
      user_input.style.display = "inline";
      server_input.selectedIndex = 3;

      // populate the text box
      var other_content_server = document.getElementById("other_content_server");
      other_content_server.value = posting_content_server_url;

      // show the other box
      $("#user").css('display', 'inline');
  }
}

/**
 * Save the current content server setting.
 *
 * @param {event} event the save button's click event.
 *
 */
function saveServer(event){

  // fired event object
  var target = event.target;
  
  // reset status
  var status = document.getElementById("server_status");
  status.innerHTML = "";
  
  // determine event
  switch(target.value) {
    
    // open sub menu
    case "other":
      $("#user").css('display', 'inline');
      break;
    
    // save user entered content server
    case "save_server":
      var server_selected = document.getElementById("content_server_url").value;
      if ( server_selected === "other" ) {
        var other_content_server = document.getElementById("other_content_server");
        var input = other_content_server.value;
        ls.setItem("posting_content_server_url", input);
      } else if( server_selected === "alpha" ) {
        ls.setItem("posting_content_server_url", "https://privlyalpha.org");
      } else if( server_selected === "dev" ) {
        ls.setItem("posting_content_server_url", "https://dev.privly.org");
      } else if( server_selected === "local" ) {
        ls.setItem("posting_content_server_url", "http://localhost:3000");
      }
      status.innerHTML = "Content Server Saved.";
      break;
      
    // it wasn't saved and wasn't "other" so we should hide the text input
    default:
      $("#user").css('display', 'none');
  }
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners(){

  // Glyph generation
  document.querySelector('#regenerate_glyph').addEventListener('click', regenerateGlyph);

  // content server menu listeners
  document.querySelector('#save_server').addEventListener('click', saveServer);
  document.querySelector('#content_server_url').addEventListener('change', saveServer);
  document.querySelector('#add_more_urls').addEventListener('click', addUrlInputs);

  // Click on body used to tackle dynamically created remove whitelist url buttons
  document.querySelector('body').addEventListener('click', removeWhitelistUrl);

  document.querySelector('body').addEventListener('input', inputEvent);
}

/**
 * Generate a new color glyph unique to this extension. The generated string
 * should only be used for the anti-spoofing glyph. The resulting string is
 * not cryptographically secure.
 */
function regenerateGlyph() {

  var div = document.getElementById("glyph_div");
  while (div.hasChildNodes()) {
    div.removeChild(div.lastChild);
  }

  ls.setItem("glyph_color", Math.floor(Math.random()*16777215).toString(16));

  var glyph_cells = ((Math.random() < 0.5) ? "false" : "true");
  for( var i = 0; i < 14; i++) {
    glyph_cells += "," + ((Math.random() < 0.5) ? "false" : "true");
  }
  
  ls.setItem("glyph_cells", glyph_cells);
  
  writeGlyph();
}

/**
 * Creates the security glyph for the page as a series of random colors.
 * The glyph is represented as a row of colors defined in local storage.
 * The row is written as a table and assigned to the div element glyph_table.
 */
function writeGlyph() {

  var glyphString = ls.getItem("glyph_cells");
  var glyphArray = glyphString.split(",");
  
  // The 5x5 table that will represent the glyph.
  // Its 3rd column will be axis of symmetry
  var table = document.createElement("table");  
  table.setAttribute("class", "glyph_table");
  table.setAttribute("dir", "ltr");
  table.setAttribute("width", "30");
  table.setAttribute("border", "0");
  table.setAttribute("summary", "Privly Visual Security Glyph");

  var tbody = document.createElement("tbody");

  for(var i = 0; i < 5; i++) {
    var tr = document.createElement("tr");

    for(var j = 0; j < 5; j++) {
      var td = document.createElement("td");
      td.innerHTML = "&nbsp";

      // Fill only the first three columns with the coresponding values from glyphArray[]
      // The rest of two columns are simetrical to the first two
      if(j <= 2) {
        if(glyphArray[i * 3 + j] === "true") {
          td.setAttribute("class", "glyph_fill");
        } else {
          td.setAttribute("class", "glyph_empty");
        }        
      } else {
        if(glyphArray[i * 3 + (5 % (j + 1))] === "true") {
          td.setAttribute("class", "glyph_fill");
        } else {
          td.setAttribute("class", "glyph_empty");
        }
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  document.getElementById("glyph_div").appendChild(table);  
  
  $('.glyph_fill').css({"background-color": '#' + ls.getItem("glyph_color")});
  $('.glyph_empty').css({"background-color": '#ffffff'});

}

/**
 * Adds an input text element in white list form for each call.
 */
function addUrlInputs () {
  var input = document.createElement('input');
  var parent = document.createElement('div');
  var remove = document.createElement('span');

  remove.className = "glyphicon glyphicon-remove remove_whitelist";
  input.type = "text";
  input.className = "whitelist_url form-control";
  parent.appendChild(input);
  parent.innerHTML += " ";
  parent.appendChild(remove);
  document.getElementById('urls').appendChild(parent);
}

/**
 * Removes the input text element of which remove has been called.
 *
 * @param {event} event The event fired by a click event. If the
 * event is from an element with the classname "remove_whitelist"
 * its parent will be removed.
 *
 */
function removeWhitelistUrl (event) {

  var target = event.target;
  if (target.className.indexOf('remove_whitelist') >= 0) {

    var domainToRemove = target.getAttribute("data-value-to-remove");

    var whitelist = ls.getItem("user_whitelist_json");
    whitelist.splice(whitelist.indexOf(domainToRemove), 1);

    var domainRegexp = "";

    for (var i = 0 ; i < whitelist.length ; i++) {
      if (whitelist[i] !== domainToRemove)
        domainRegexp += "|" + whitelist[i] + "\\/";

    }
    ls.setItem("user_whitelist_json", JSON.stringify(whitelist));
    ls.setItem("user_whitelist_regexp", domainRegexp);
    target.parentElement.remove();
  }
}

/**
 * Saves the whitelist if the whitelist changed.
 * @param {event} ev The input event.
 */
function inputEvent (ev) {
  var target = ev.target;
  if (target.classList.contains('whitelist_url')) {
    saveWhitelist();
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded',
  function() {

    // Don't initialize the app if it is running in a
    // headless browser.
    if( ! document.getElementById("logout_link") ) {
      return;
    }

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();

    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      privlyNetworkService.showLoggedInNav,
      privlyNetworkService.showLoggedOutNav
    );

    $("#messages").hide();
    $("#form").show();
    $("#server_form").show();

    // Don't start the script if it is running in a Headless
    // browser
    if( document.getElementById("logout_link") ) {
      restoreCheckedSetting();
      restoreWhitelist(); // Restore whitelist settings
      restoreServer(); // Restore server settings
      listeners(); // Listen for UI events
      writeGlyph(); // Write the spoofing glyph to the page
    }

  }
);
