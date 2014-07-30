/**
 * @fileOverview Manages the form interaction with remote servers.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app is currently requesting the CSRF
 *    token from the remote server. Callback=pendingLogin
 * 2. Failure to login: The user is not currently authenticated with the
 *    remote server. In this state the user is prompted to login.
 *    Callback=loginFailure
 * 3. Pending post: The user can make the post at this point.
 *    Callback=pendingPost
 * 4. submit: the user has submitted the posting form.
 *    Callback=submit
 * 5. Completed post: The remote server has returned a URL. This app should
 *    display it and fire the URL event.
 *    Callback=postCompleted
 */

var callbacks = {

  /**
   * Assign the CSRF token if it is a Privly server.
   */
  pendingLogin: function() {
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Generate the previewed content
    var contentElement = document.getElementById("content");
    contentElement.addEventListener('keyup', previewMarkdown);
    
  },

  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  loginFailure: function() {
    $("#messages").hide();
    $("#login_message").show();
    $("#refresh_link").click(function(){location.reload(true);});
  },

  /**
   * Check if user has set a passed in item
   *
   * @param {string} option A string representing a localforage key.
   * @param {function} callback The function to execute after the value of the
   * option has been acquired. This function should accept as a paremeter the
   * value of the option that was acquired.
   * 
   */
  assureItemIsSet: function(option,callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem(option,function(value){
        if (value == undefined || value == ""){
          if (option === 'pgp-email'){
            keyManager.promptUserToSetEmail(function(value){
              callback(value);
            });
          }
          else if (option === 'pgp-directoryURL'){
            keyManager.promptUserToSetDirectory(function(value){
              callback(value);
            });
          }
        } else {
          callback(value);
        }
      });
    });
  },

  /**
   * Check if user has set options
   *
   * @param {function} callback The function to execute after all items have
   * been set.
   */
  checkOptionsSet: function(callback){
    var items = ['pgp-email','pgp-directoryURL'];
    var set = 0;
    var check = function(option){
      callbacks.assureItemIsSet(option,function(value){
        set += 1;
        if (set === items.length){
          callback(true);
        }
      });
    };
    for (var i = 0; i < items.length; i++){
      check(items[i]);
    }
  },

  /**
   * Check if user needs to generate new keys
   */
  checkForKeyManagement: function() {
    keyManager.needPersonaKey(function(persona_need){
      if (persona_need === true){
        keyManager.promptUserToLogin();
      }
      keyManager.needNewKey(function(pgp_need){ 
          if (pgp_need === true){
            keyManager.genPGPKeys();
          }
      });
    });
  },

  /**
   * Populate autocomplete from from localstorage
   *
   * @param {function} callback The function to execute after the list of
   * contacts has been retrieved. This function should accept an array of
   * emails as a paremeter.
   */
  populateToField: function(callback){
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('pgp-my_contacts',function(contacts){
        var emails = [];
        for(var email in contacts){
          if (contacts.hasOwnProperty(email)){
            emails.push(email);
          }
        }
        callback(emails);
      });
    });
  },

  /**
   * Modify the text of the missing email notifier and then show it.
   */
  inviteFriendNotifier: function(email){
    var emails = $("#missingEmails").text();
    var whitespace = /^\s+$/mg;  // entire string is whitespace
    if (whitespace.exec(emails) != null) {
      emails = email;
    } else {
      var existing = new RegExp("(\\s|^)"+email+"\\b"); 
      if (existing.exec(emails) === null ){ //already contains the email?
        emails = $("#missingEmails").text() + ", " + email;
      }
    }
    $("#missingEmails").text(emails);
    $("#missingEmails").css({
      "font-size" : "1.1em",
      "font-weight" : "bold"
    });
    $(".dropdown").css({"list-style-type":"none"});
    $("#invite").click(function(){  // Add email to URLs in dropdown
      $("#inviteMenu li a").each(function(){
        var old = $( this ).attr("href");
        var urlemail = encodeURIComponent(emails);
        var updated = old.replace(/\[FRIENDS\]/,urlemail);
        $( this ).attr("href",updated);
      });
    });
    $("#emailInvite").show();
  },

  /**
   * Remove an email address from the autoComplete selection 
   */
  autoCompleteRemove: function(remove){
    $(".select2-search-choice div:last").css({
      "font-size" : "1.1em",
      "font-weight" : "bold"
    });
    $(".select2-search-choice:last").fadeOut(1500,function(){
      var emails = $("#emailAddresses").select2("val");
      var updated = [];
      for (var i = 0; i < emails.length; i++){
        if (emails[i] !== remove){
          updated.push(emails[i]);
        }
      }
      $("#emailAddresses").select2("val",updated);
    });
  },

  /**
   * Highlight an email address in the autoComplete selection 
   */
  autoCompleteHighlight: function(email){
    $(".select2-search-choice:last")
      .css("border","2px solid green")
      .animate({
        "border-width":"1px",
        "border-color":"solid #aaaaaa"
        },1000);
  },

  /**
   * Setup and manage autocomplete form
   */
  autoComplete: function(){
    callbacks.populateToField(function(emails){
      $("#emailAddresses").select2({
        placeholder: "Recipients",
        tags: emails,
        tokenSeparators: [" ",","]
      }).on("change",function(change){
        if (change.added !== undefined){               // tag was added
          if (emails.indexOf(change.added.id) === -1){ // tag was new
            var email = change.added.id;
            // Search Remotely, verify and add to local if found
            PersonaPGP.findPubKey(email, function(results){
              if (results === null){ // not found remotely or locally
                callbacks.inviteFriendNotifier(email);
                callbacks.autoCompleteRemove(email);
              } else { // Found, update ui somehow?
                callbacks.autoCompleteHighlight(email);
                // This branch is taken if email is in the directory but the
                // returned keys are expired.
                // TODO: Rewrite findPubKey chain of functions to propagate
                // errors or provide some sort of feedback of this situation.
              }
            });
          }
        }
      });
    });
  },

  /**
   * Tell the user they can create their post
   */
  pendingPost: function() {
    
    privlyNetworkService.showLoggedInNav();
    
    // Monitor the submit button
    document.querySelector('#save').addEventListener('click', callbacks.submit);
    $("#save").prop('disabled', false);
    $("#messages").toggle();
    $("#form").toggle();

    callbacks.autoComplete();
  },

  /**
   * The user hit the submit button.
   */
  submit: function() {
    var plaintext = $("#content")[0].value;
    var emails = $("#emailAddresses").val();
    emails = emails.split(",");

    PersonaPGP.encrypt(emails,plaintext,function(ciphertext){
      var data_to_send = {
        post:{
          structured_content: ciphertext,
          "privly_application":"PGP",
          "public":true,
          "seconds_until_burn": $( "#seconds_until_burn" ).val()
        }
      };

      function successCallback(response) {
        callbacks.postCompleted(response); 
      }
      
      privlyNetworkService.sameOriginPostRequest(
        privlyNetworkService.contentServerDomain() + "/posts", 
        successCallback, 
        data_to_send,
        {"format":"json"});
    });
  },

  /**
   * Send the URL to the extension or mobile device if it exists and display
   * it to the end user.
   *
   * @param {response} response The response object returned from the remote server
   *
   */
  postCompleted: function(response) {
    var url = response.jqXHR.getResponseHeader("X-Privly-Url");
    privlyExtension.firePrivlyURLEvent(url);

    $("#messages").text("Copy the address found below to any website you want to share this information through");
    $(".privlyUrl").text(url);
    $(".privlyUrl").attr("href", url);
    
    // Keep the user in local code if possible, but display the remote code link
    // so the user does not accidentally copy the local code url
    if ( privlyNetworkService.platformName() !== "HOSTED" ) {
      var localCodeURL = "show.html?privlyOriginalURL=" + encodeURIComponent(url);
      $('.privlyUrl').one('click', function (e) {this.href = localCodeURL;});
    }
    $("#messages").show();
  }
};


/**
 * Get the CSRF token and starting content for the form element. 
 */
function initPosting() {
  
  // Assign the CSRF token if it is a Privly server. We use the success
  // callback for all callbacks because we don't assume the content
  // server uses the account details endpoint that the Privly content
  // server hosts.
  privlyNetworkService.initPrivlyService(
    privlyNetworkService.contentServerDomain(), 
    callbacks.pendingPost, 
    callbacks.loginFailure, 
    callbacks.loginFailure);
                                         
  // Listener for the extension sending initial content
  privlyExtension.initialContent = function(data) {
    $("#content")[0].value = data.initialContent;
  };
  
  // Once the message pathway is established, it will immediatly ask for any
  // starting content.
  privlyExtension.messageSecret = function(data) {
    privlyExtension.messageExtension("initialContent", "");
  };
  
  // Initialize message pathway to the extension.
  privlyExtension.firePrivlyMessageSecretEvent();
  
  callbacks.pendingLogin();
  callbacks.checkOptionsSet( callbacks.checkForKeyManagement );
};

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  preview.innerHTML = markdown.toHTML(document.getElementById("content").value);
}

document.addEventListener('DOMContentLoaded', initPosting);

//Add listeners to show loading animation while making ajax requests
$(document).ajaxStart(function() {
  $('#loadingDiv').show(); 
});
$(document).ajaxStop(function() { 
  $('#loadingDiv').hide(); 
});
