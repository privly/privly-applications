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
 * 6. Key Search: Check localForage and remote directory for keys associated 
 *    with email address. Should return public key of message recipient.
 *    Callback=findPubKey
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
   * Tell the user they can create their post
   */
  pendingPost: function() {
    
    privlyNetworkService.showLoggedInNav();
    
    // Monitor the submit button
    document.querySelector('#save').addEventListener('click', callbacks.submit);
    $("#save").prop('disabled', false);
    $("#messages").toggle();
    $("#form").toggle();
  },

  /**
   * The user hit the submit button.
   */
  submit: function() {
    // Here we convert the plaintext into a json string. We do this to check if
    // the decryption occured with the correct string.  If it's formated as json
    // it is extremely unlikely to have been decrypted with the wrong key.
    var plaintext_as_json = JSON.stringify({message: $("#content")[0].value});
    var ciphertext = openpgp.encryptMessage([pubKey],plaintext_as_json);

    var data_to_send = {
      post:{
        structured_content: ciphertext,
        "privly_application":"pgp",
        "public":true,
        "seconds_until_burn": $( "#seconds_until_burn" ).val()
      }};

    function successCallback(response) {
      callbacks.postCompleted(response); 
    }
    
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts", 
      successCallback, 
      data_to_send,
      {"format":"json"});
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
  },

  /**
   * Attempt to find the public key of a given email address.  Looks at local
   * resources before querying remote resources. 
   *
   * @param {email} email The email that the user wants to find the associated 
   * pub key of.
   *
   */
  findPubKey: function(email){
    var pub_keys = null;

    // query localForage 
    localforage.getItem('pubKeys',function(pubkey_email_hash){
      if (email in pubkey_email_hash) {

        pub_keys = [pubkey_email_hash[email]]; 
        return pub_keys; //array of pub keys associated with email

      } else { // not found locally, query DirP
        pub_keys = findPubKeyRemote(email);
        if (pub_keys === null){
          console.log("No public key associated with email found");
          console.log("Invite friend to share privately here");
        }
        return pub_keys;
      }
    });
  },

  findPubKeyRemote: function(email){
    var remote_directory = "https://127.0.0.1:10001";
    var pub_keys = null;
    $.get(
      remote_directory,
      {email: email},
      function(response){
        if (response.status === 200) {
          var data = response.responseText;
          if (data !== null) {
            // The format of the response is not currently known.  Once data
            // structure of UC & IA with extra pub key is known, update with
            // appropriate values.
            pub_keys = data; // this line is wrong, update me
            return pub_keys;
          } else {
            return null;
          }
        } else {
          // handle other status responses in the future
          console.log("Response status was not 200");
          return null;
        }
      }
    );
  }
}


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
  }
  
  // Once the message pathway is established, it will immediatly ask for any
  // starting content.
  privlyExtension.messageSecret = function(data) {
    privlyExtension.messageExtension("initialContent", "");
  }
  
  // Initialize message pathway to the extension.
  privlyExtension.firePrivlyMessageSecretEvent();
  
  callbacks.pendingLogin();
  
}

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
