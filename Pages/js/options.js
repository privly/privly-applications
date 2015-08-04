/**
 * @fileOverview options.js loads options from local storage to
 * initialize forms, and saves updates to the options.
 *
 * Available options include setting the some-trust whitelisted domains 
 * and the server the user uploads their content to when generating new
 * injectable links.
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
  Privly.options.setPrivlyButtonEnabled(!checkedState);

  status.innerHTML = "Setting Saved."; 
  setTimeout(function() {
    status.innerHTML = "";
  }, 1000);
}

/**
 * Restores user's setting to disable Privly button appearance
 */
function restoreCheckedSetting() {
  var btn = document.getElementById("disableBtn");
  if ( btn === null ) {return;} // Don't run on Firefox

  btn.checked = !Privly.options.isPrivlyButtonEnabled();

  // Save the current setting for the Privly button appearance
  btn.addEventListener('click', saveCheckedSetting);
}

/**
 * Saves user's custom whitelist to local storage.
 */
function saveWhitelist() {
  var url_inputs = document.getElementsByClassName('whitelist_url');
  
  var domains = [];  // Stores whitelist inputs and whitelisted values
  var input_fields = [];
  [].forEach.call(url_inputs, function (input) {
    input.className = "whitelist_url form-control"; // remove error class
    var domain = input.value.replace(/ /g, "")
                            .replace(/[^a-zA-Z0-9\-:._]/g, "");
    if (domain.length > 0) {
      domains.push(domain);
      input_fields.push(input);
    }
  });

  var invalid_domains = false;
  var invalid_domain = document.getElementById('invalid_domain');
  invalid_domain.className = ''; // hide the error message

  for (var i = 0; i < domains.length; ++i) {
    if (!Privly.options.isDomainValid(domains[i])) {
      input_fields[i].className += " invalid-domain";
      invalid_domains = true;
    }
  }

  if (invalid_domains) {
    invalid_domain.className = 'show';
  } else {
    Privly.options.setWhitelist(domains);
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
  var user_whitelist = Privly.options.getWhitelistDomains();
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
  
  var posting_content_server_url = Privly.options.getServerUrl();
  var server_input = document.getElementById("content_server_url");

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
      var input;
      if ( server_selected === "other" ) {
        input = document.getElementById("other_content_server").value;
      } else if( server_selected === "alpha" ) {
        input = "https://privlyalpha.org";
      } else if( server_selected === "dev" ) {
        input = "https://dev.privly.org";
      } else if( server_selected === "local" ) {
        input = "http://localhost:3000";
      }
      Privly.options.setServerUrl(input);
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

  Privly.glyph.generateGlyph();
  writeGlyph();

}

/**
 * Creates the security glyph for the page as a series of random colors.
 * The glyph is represented as a row of colors defined in local storage.
 */
function writeGlyph() {
  var canvas = Privly.glyph.getGlyphDOM();
  document.getElementById("glyph_div").appendChild(canvas);
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
    target.parentElement.remove();
    saveWhitelist();
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
