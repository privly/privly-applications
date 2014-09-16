/**
 * @fileOverview Logs the user into the content server.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app does not currently know whether it is logged
 *    in
 * 2. Not logged in: The app displayed the login form for the user.
 * 3. Login Failure: the user supplied incorrect credentials for logging
 *    into the remote server.
 * 4. Submit Credentials: Send the credentials to the remote server.
 * 5. Check Credentials: The credentials check has returned from the
 *    server and is being checked for acceptance.
 * 6. Login Failure: The server did not grant the user a session.
 * 7. Login Error: The server could not be reached or had an internal error.
 * 8. Pending Post: The user is properly logged in and can create content.
 */
var callbacks = {
  
  /**
   * Initialize the whole application.
   */
  pendingLogin: function() {
    
    // Get the domain the user's extension is paired with
    var domain = privlyNetworkService.contentServerDomain();
    
    // Display the content server the user is asssociated with
    $(".content_server").text(domain);
    
    // Set the domain to the proper content server
    $(".login_issue").each( function( key, value ) {
      $(value).attr("href", domain + $(value).attr("data-path-sub"))
    });
    
    privlyNetworkService.showLoggedOutNav();
    
    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();
    
    // Monitor the login button
    document.querySelector('#login').addEventListener('click', callbacks.submitCredentials);
    $("#user_password").keyup(function (e) {
        if (e.keyCode == 13) {
            callbacks.submitCredentials();
        }
    });
    
    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function() {
      $('#loadingDiv').show(); 
    });
    $(document).ajaxStop(function() { 
      $('#loadingDiv').hide(); 
    });
    
    // See if the user is currently logged in
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(), 
      callbacks.pendingPost, 
      callbacks.notLoggedIn, 
      callbacks.loginError);
  },
  
  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   */
  notLoggedIn: function() {
    $("#messages").hide();
    $("#form").show();
  },
  
  /**
   * Submit the posting form and await the return of the post.
   */
  submitCredentials: function() {
    $("#save").prop('disabled', true);
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/users/sign_in", 
      callbacks.checkCredentials,
      {"user[email]":  $("#user_email").val(),
       "user[password]":  $("#user_password").val()
       });
  },
  
  
  /**
   * Check to see if the user's credentials were accepted by the server.
   */
  checkCredentials: function(response) {
    
    if ( response.json.success === true ) {
      callbacks.pendingPost();
    } else {
      callbacks.loginFailure();
    }
  },
  
  /**
   * Tell the user their credentials were rejected.
   */
  loginFailure: function() {
    $("#messages").text("Bad username or password. " + 
      "Too many failed attempts will lock the account.");
    $("#messages").show();
  },
  
  /**
   * Tell the user their content server could not be reached.
   */
  loginError: function() {
    $("#messages").text("Your content server is unavailable.");
    $("#messages").show();
  },
  
  /**
   * Tell the user they are now logged in to the server.
   */
  pendingPost: function() {
    
    // get from localStorage the last known app to redirect to
    if(localStorage["Login:redirect_to_app"] !== undefined &&
       localStorage["Login:redirect_to_app"].indexOf("Login") < 0) {
      window.location = localStorage["Login:redirect_to_app"];
    } else {
      window.location = "../Help/new.html";
    }
  },

  /**
   * Genereate a PGP key if it does not exist or is nearly expired
   */
  genPGPKeys: function(){
    // Determine if a key is already in local storage
    localforage.setDriver('localStorageWrapper',function(){
      localforage.getItem('my_keypairs',function(keypair){

        if (keypair === null){ // it does not exist, make it
          console.log("Generating New Key");
          var workerProxy = new openpgp.AsyncProxy('../vendor/openpgp.worker.js');
          workerProxy.seedRandom(10); // TODO: evaluate best value to use
          workerProxy.generateKeyPair(
            openpgp.enums.publicKey.rsa_encrypt_sign,
            1028,'username','passphrase',function(err,data){ // TODO: increase key size
              // TODO: need to already know user's email, hard coded for now
              var email = "bob@example.com";
              var datas = {}
              datas[email] = [data];
              //localforage.setItem('my_keypairs',datas).then(callbacks.uploadKey());
              localforage.setItem('my_keypairs',datas);  // TODO: actually upload key
              // Make sure you can send encrypted messages to yourself
              // Just pub key in contacts
              var pub = {}
              pub[email] = [data.publicKeyArmored]; 
              localforage.setItem('my_contacts',pub);  
            }
          );
        } else { // it does exist, do nothing for now
          console.log("Already have a key");
          console.log(keypair["bob@example.com"][0]);
          // TODO: check if key is about to expire and gen a new one if needed
        }
      });
    });
  },

  /**
   * Upload a signed key along with associated user certificate to directory
   */
  uploadKey: function(email,ballOwax){
    localforage.getItem('my_keypairs',function(keypair){
      if (keypair === null){
        console.log("No key to upload found");
        return false;
      }
      console.log(keypair);
      var email = "bob@example.com";
      var directoryURL = "http://127.0.0.1:8989/"
      var pubkey = "foo";
      console.log("Oh noes");
      console.log(pubkey);
      $.post(
        directoryURL,
        {email:email, 
          uc: "uc", 
          ia: "ia", 
          pgp_pub: pubkey,
          sign_pgp_pub: "foo_signed"
        },
        function(response){
          if (response.status === 200){
            console.log(response);
          }
        }
      );
      console.log("sent");
    });
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', callbacks.pendingLogin);
