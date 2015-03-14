/**
 * @fileOverview This is a general adapter for interfacing with the Privly-web
 * server: github.com/privly/privly-web
 *
 * Its purpose is to allow all privly-web derived applications to interface
 * with privly-web through a consistent adapter, thereby speeding updates
 * and easing the generation of a large number of applications.
 *
 * It manages the general flow of an application that interfaces with the 
 * privly-web server but it is intended to be extended as necessary by
 * individual privly-applications. For example, see show.js in the PlainPost
 * Privly Application.
 *
 * ## Expected URL Elements ##
 * This adapter expects the URL associated with the application to have
 * parameters specifying where the application's data resides.
 * 'privlyDataURL': Where the source data is stored.
 *
 *
 * ## Expected DOM Elements ##
 * This adapter expects the DOM to have the set of elements defined below.
 * '#destroy_link': This is the link to destroy the content.
 * '#cancel_button': This is the link to cancel the updating process.
 * '#edit_link': This is the link to start the updating process.
 * '#post_content': This is the content displayed to the end user.
 * '#messages': These are UI messages presented to the user.
 * '#login_message': This is the message telling the user they need to login.
 * '#no_permissions_nav': The navigation that is shown if the user has no 
                          permissions on the content.
 * '#permissions_nav': The navigation that is shown if the user has permissions
                       on the content.
 * '#destruction_select_block': The editing form's desruction timeframe 
                                select block.
 * '#current_destruction_time': When the content will be destroyed on the server.
 * '#seconds_until_burn': The number of seconds until the content is destroyed.
 * '#edit_form': The form for editing the content.
 * '#edit_text': The text in the text area for editing.
 * '.meta_created_at': When the content was created.
 * '.meta_destroyed_around': When the content will be destroyed.
 *
 * ## Extending this script ##
 * Each of these functions have callbacks that will be called at the
 * end of the function, if the callback is defined.
 * If you need to modify the inputs to these callbacks or to perform an 
 * action before the callback is executed, we recommend you overwrite the
 * callback with a new callback that calls the original callback with the
 * modified parameters. For example:
 *
 * var oldCallback = callbacks.postCompleted;
 * callbacks.postCompleted = function(response) {
 *   oldCallback(response, "modified");
 * }
 *
 **/
/* jshint undef: true, unused: true */
/* global privlyParameters, $, privlyNetworkService, privlyHostPage */
/* global privlyTooltip, loadInjectedCSS, loadInjectedJS, loadTopCSS, loadTopJS */

/**
 * @namespace
 *
 * State variables used accross all the callbacks.
 *
 */
var state = {

  /**
  * The parameters found on the app's URL as parsed by the parameter script.
  */
  parameters: {},

  /**
  * The URL of the application when accessed via the remote server. This
  * parameter is usually assigned by the extension since the original URL
  * is replaced by one served from the extension.
  */
  webApplicationURL: "",

  /**
  * The URL of the data endpoint for this application.
  */
  jsonURL: "",

  /**
  * Reference to the setTimeout so that we can clear it
  * in case user double clicks for inline editing
  **/
  timeoutRef: "",

  /**
  * Variable to check if the iframe has been clicked before
  * for inline editing
  **/
  isClicked: false,
  
  /**
  * Variable to check if the editing is done inline or not.
  * 
  **/
  isInlineEdit: false
};

/**
 * The callbacks assign the state of the application.
 *
 * This application can be placed into the following states:
 * 1. Pending Content: The app is currently requesting the content.
 *    Callback=pendingContent
 * 2. Pending Login: The user needs to login to the server storing the
 *    content. After login, they may have access.
 *    Callback=pendingLogin
 * 3. Content Returned: The server returned the content for display.
 *    Callback=contentReturned
 * 4. Destroy: The user clicked the "destroy" button.
 * 5. Destroyed: The server returned a response from the destroy command.
 * 6. Edit: The user clicked the "edit" button.
 * 7. Update: The user submitted the "edit" form.
 * 8. click: The user clicked the application. This is primarily used when
 *    the application is injected into the context of a host page.
 *    Callback=click
 */

var callbacks = {

  /**
   * Initialize the whole application.
   * @param {function} callback The function that will be executed after
   * content is returned from the remote server. This function will be
   * called with the response object as a parameter.
   */
  pendingContent: function(callback) {

    // Set the application and data URLs
    var href = window.location.href;
    state.webApplicationURL = privlyParameters.getApplicationUrl(href);
    state.parameters = privlyParameters.getParameterHash(state.webApplicationURL);
    state.jsonURL = state.webApplicationURL;
    if (state.parameters.privlyDataURL !== undefined) {
      state.jsonURL = state.parameters.privlyDataURL;
    }

    // Display the data source to the user
    var domainSelector = document.createElement('a');
    domainSelector.href = state.jsonURL;
    $(".meta_source_domain").text("Data Source: " + domainSelector.hostname);

    // Display the data source to the user
    $(".meta_source_url").text(state.webApplicationURL);

    // Register the click listener.
    $("#post_content").on("click", callbacks.click);
    $("#edit_form").on("click", callbacks.click);

    // Register the link and button listeners.
    $("#destroy_link").click(callbacks.destroy);
    
    // Watch the update button and pass the content callback
    // to the update function
    document.getElementById("update").addEventListener('click', 
      function(evt){callbacks.update(evt, callback);});
    $("#edit_link").click(callbacks.edit);

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();

    if(privlyHostPage.isInjected()) {

      // Force links to open in a new window/tab
      var openBlank = document.createElement("base");
      openBlank.setAttribute("target", "_blank");
      document.getElementsByTagName('head')[0].appendChild(openBlank);

      // Creates a tooptip which indicates the content is not a 
      // natural element of the page
      privlyTooltip.tooltip();

      // Send the height of the iframe everytime the window size changes.
      // This usually results from the user resizing the window.
      // This causes performance issues on Firefox.
      if( privlyNetworkService.platformName() !== "FIREFOX" ) {
        $(window).resize(function(){
          privlyHostPage.resizeToWrapper();
        });
      }
      
      // Display the domain of the content in the glyph
      var dataDomain = privlyNetworkService.getProtocolAndDomain(state.jsonURL);
      privlyTooltip.updateMessage(dataDomain, "Read Only");
      
      // Load CSS to show the tooltip and other injected styling
      loadInjectedCSS();
      loadInjectedJS();
    } else {

      // Check whether the user is signed into their content server
      privlyNetworkService.initPrivlyService(
        privlyNetworkService.contentServerDomain(), 
        privlyNetworkService.showLoggedInNav, 
        function(){}, // otherwise assume they are logged out
        function(){} // otherwise assume they are logged out
      );

      // Load CSS to show the nav and the rest of the non-injected page
      loadTopCSS();
      loadTopJS();
    }

    // Ensure whitelist compliance of the data parameter when the content is
    // injected
    if( !privlyHostPage.isInjected() ||
        privlyNetworkService.isWhitelistedDomain(state.jsonURL) ) {

      // Make the cross origin request as if it were on the same origin.
      // The "same origin" requirement is only possible on extension frameworks
      privlyNetworkService.sameOriginGetRequest(state.jsonURL,
        function(response){callbacks.contentReturned(response, callback);});
    } else {
      $("#post_content").html("<p>Click to view this content.</p>");
    }

    callbacks.showDownloadMessage();
  },
  
  /**
  * The user may have access to the content if they login to the server
  * hosting the content.
  *
  * @param {function} callback The function to execute after this function
  * completes.
  */
  pendingLogin: function(callback) {
    
    $("#messages").hide();
    $("#login_message").show();
    
    $("#post_content").html("<p>You do not have access to this.</p>");
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
    
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
  * Process the post's content returned from the remote server.
  *
  * @param {object} response The response from the remote server. In cases
  * without error, the response body will be in response.response.
  * @param {function} callback The function that gets called after all the
  * permissions and other elemets are set. This function should accept
  * "response" as a paramter.
  */
  contentReturned: function(response, callback) {
    if( response.jqXHR.status === 200 ) {
      
      var json = response.json;
      
      privlyNetworkService.permissions.canShow = true;
      
      // Assign the permissions
      if( json.permissions ) {
        privlyNetworkService.permissions.canShare = (
          json.permissions.canshare === true);
        privlyNetworkService.permissions.canUpdate = (
          json.permissions.canupdate === true);
        privlyNetworkService.permissions.canDestroy = (
          json.permissions.candestroy === true);
      }
      
      // If the user is able to update the content,
      // we should notify the user and pre-fetch
      // the necessary credentials to post to the server
      if( privlyNetworkService.permissions.canUpdate || 
        privlyNetworkService.permissions.canDestroy ) {
          privlyNetworkService.initPrivlyService(
            state.jsonURL, 
            function(){

              // Initialize the form for updating the post
              // if the user has permission.
              if( privlyNetworkService.permissions.canUpdate) {
                $("#edit_link").show();
                $("#no_permissions_nav").hide();
                $("#permissions_nav").show();
                
                $("#cancel_button").on("click", function(evt){
                  callbacks.cancel(evt);
                  callback(response);
                });
                
                var dataDomain = privlyNetworkService.getProtocolAndDomain(state.jsonURL);
                privlyTooltip.updateMessage(dataDomain, "Editable");
                $(".meta_canupdate").show();
              }

              // Initialize the form for destroying the post
              // if the user has permission.
              if( privlyNetworkService.permissions.canDestroy) {
                $("#destroy_link").show();
                $("#no_permissions_nav").hide();
                $("#permissions_nav").show();
                $(".meta_candestroy").show();
                $("#destruction_select_block").show();
              }
            }, 
            function(){}, // otherwise assume no permissions
            function(){} // otherwise assume no permissions
          );
      }
      
      // Set creation date meta
      if( json.created_at ) {
        var createdDate = new Date(json.created_at);
        $(".meta_created_at").text("Created Around " + 
          createdDate.toDateString() + ". ");
      }
      
      // Set burnt date meta
      if( json.burn_after_date ) {
        var destroyedDate = new Date(json.burn_after_date);
        $(".meta_destroyed_around").text("Automatically Destroyed Around " +
          destroyedDate.toDateString() + ". ");
        var currentSecondsUntilDestruction = Math.floor((destroyedDate - Date.now())/1000);
        $("#current_destruction_time")
          .attr("value", currentSecondsUntilDestruction)
          .text(Math.floor(currentSecondsUntilDestruction / 86400) + " Days");
        $("#seconds_until_burn").val(currentSecondsUntilDestruction);
      } else {

        // Set the displayed value on the form. The value is already infinity
        $("#current_destruction_time") 
          .text("Infinite");
        $(".meta_destroyed_around").text("This content is not scheduled to destruct.");
      }
      
    } else if(response.jqXHR.status === 403 || response.jqXHR.status === 422) {
      $("#post_content").html(
          "<p class='flash notice'>" +
          "<span class='glyphicon glyphicon-remove-sign' aria-hidden='true'></span> " +
          "Your current user account does not have access to this. " +
          "It is also possible that the content was destroyed at the source.</p>");
    } else {
      $("#post_content").html("<p class='flash notice'>" +
        "<span class='glyphicon glyphicon-remove-sign' aria-hidden='true'></span> " +
        "You do not have access to this.</p>");
    }
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    privlyHostPage.resizeToWrapper();
    
    // Send the content to the callback for processing
    if(callbacks.functionExists(callback)) {
      callback(response);
    }
  },
  
  /**
   * The destroy button was just pushed. Ask the remote server to destroy 
   * the content associated with the post, then notify the user of the results
   * in callbacks.destroyed.
   *
   * @param {function} callback A function to be executed when the content is
   * returned from the remote server after destruction. This function is called
   * with the response object after "destroyed" is executed.
   */
  destroy: function(callback) {
    $("#edit_form").slideUp();
    privlyNetworkService.sameOriginDeleteRequest(state.jsonURL, 
      function(response){callbacks.destroyed(response, callback);}, {});
  },
  
  /**
  * Process the content returned from the server on a destroy request.
  *
  * @param {object} response The response from the remote server.
  * @param {function} callback A function to be executed when the content is
  * returned from the remote server after destruction. The callback is passed
  * the response object.
  */
  destroyed: function(response, callback) {
    if( response.jqXHR.status === 200 ) {
      
      // Tell the user the content was probably destroyed
      $("#post_content").html(
        "<p class='flash notice'>The remote server says it destroyed the content. " +
        "If the server cannot be trusted, then it may have copies.</p>");
      
      // Hide the drop down menu
      $("#no_permissions_nav").show();
      $("#permissions_nav").hide();
      
      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
      
    } else {
      $("#post_content").html("<p>You do not have permission to destroy this.</p>");

      // Tells the parent document how tall the iframe is so that
      // the iframe height can be changed to its content's height
      privlyHostPage.resizeToWrapper();
    }
    
    if(callbacks.functionExists(callback)) {
      callback(response);
    }
  },
  
  /**
   * Display the form for editing the post. This callback is not currently
   * supported in injected mode.
   * @param {function} callback The function to call after showing the edit
   * form.
   */
  edit: function(callback) {
    $("#edit_form").slideDown();
    
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * Update the remote server's content with the new value.
   * This function should only be called if the remote server's
   * initial response had the permission object, and the update
   * flag was set to true. This prevents some CSRF issues.
   *
   * @param {event} evt The event triggered by the update button being clicked.
   * @param {function} callback A function to be executed when the content is
   * returned from the remote server after update. This function is called
   * with the response object.
   */
  update: function(evt, callback) {
    var contentToPost = {post:
      {
        content: $("#edit_text").val(),
        seconds_until_burn: $( "#seconds_until_burn" ).val()
      },
      format:"json"};
    privlyNetworkService.sameOriginPutRequest(state.jsonURL, 
      function(response){callbacks.contentReturned(response, callback);},
        contentToPost);
    
    // needed to stop click event from propagating to body
    // and prevent a new window from opening because of click listener
    // on body.
    evt.stopPropagation();
    
    // Close the editing form
    $("#edit_form").hide();
    state.isInlineEdit = false;
  },
  
  /**
  * This is an event listener for cancel event.
  *
  * @param {event} evt The event triggered by the cancel button
  *  being clicked.
  *
  */
  cancel: function(evt, callback){
    $("#edit_form").hide();
    
    // needed to stop click event from propagating to body
    // and prevent a new window from opening because of click listener
    // on body.
    evt.stopPropagation();
    
    // Resize to its wrapper
    privlyHostPage.resizeToWrapper();
    state.isClicked = false;
    state.isInlineEdit = false;
    
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
  * This is an event listener for click events. When the applicaiton is
  * injected into the context of a host page, the app will be opened in 
  * a new window.
  *
  * @param {event} evt The event triggered by the window being clicked.
  * @param {function} callback The function to call after the click
  * function is evaluated.
  *
  */
  click: function(evt, callback) {
    
    if( ! privlyNetworkService.permissions.canUpdate ) {
      callbacks.singleClick(evt, callback);
      return;
    }
    
    if (state.isClicked) {
      var target = $(evt.target);
      if (state.isInlineEdit && !target.is("textarea") &&
          !target.is("select")) {
        
        // Double click During inline Editing
        // and not on the textarea or the dropdown.
        callbacks.cancel(evt);
        state.isClicked = false;
      }
      else{
        state.isInlineEdit = true;
        clearTimeout(state.timeoutRef);
        state.isClicked = false;
        callbacks.doubleClick();
      }
    }
    else{
      state.isClicked = true;
      if (state.isInlineEdit) {
        
        // Single Click During inline Editing
        setTimeout(function(){
          state.isClicked = false;
        },200);
      }
      else{
        state.timeoutRef = setTimeout(function(){
          callbacks.singleClick(evt);
        },200);
      }
    }
    
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * This is the handler for single click event on the iframe
   * It opens a new tab with the post content
   *
   * @param {event} evt The click event triggered by the user's interaction.
   * @param {function} callback The function to call after the single click is
   * processed.
   */
  singleClick: function(evt, callback) {
    state.isClicked = false;
    if (privlyHostPage.isInjected()) {
      if (evt.target.nodeName !== "A" || evt.target.href === "") {
       window.open(location.href, '_blank');
     }
   }
   
   if(callbacks.functionExists(callback)) {
     callback();
   }
  },
  
  /**
  * This is the function called when user presses double clicks
  * on the iframe and is used for inline editing.
  *
  * You should also bound doubleclick to canceling the editing
  * mode whenever it is inline editing. This is currently the
  * default.
  *
  * @param {function} callback The function to call after the doubleclick
  * handler is complete.
  *
  */
  doubleClick: function(callback) {
    $("#edit_form").show();
    
    // Hide the Heading when editing inplace
    $("#edit_form h1").hide();
    $('#edit_text').css('width',"95%");
    callbacks.edit();

    // Resize to show the text area update, cancel buttons and burn after
    privlyHostPage.resizeToWrapper();
    
    if(callbacks.functionExists(callback)) {
      callback();
    }
  },

  /**
   * If the application is shown in the hosted context then the download
   * link should be shown.
   *
   * @param {function} callback The function to call after the doubleclick
   * handler is complete.
   */
  showDownloadMessage: function(callback) {

    // Show the download extension link in the hosted context
    if( privlyNetworkService.platformName() === "HOSTED" && !privlyHostPage.isInjected() ){

      // Pick which browser logo and link href to display
      var browser = "firefox";
      if (navigator.userAgent.indexOf("Chrome") !== -1){
        browser = "chrome";
      }
      var target = $("#downloadmessage a").data("privly-" + browser);
      $("#downloadmessage a").attr("href", target);
      $("#downloadmessage p a").attr("href", target);

      $("#" + browser + "_img").show(); // show current browser image

      // Determine string of header
      var referrer = document.referrer;
      var msg = "You don't need to ";
      if (referrer === ""){
        msg += "visit this page!";
      } else {
        var anchor = document.createElement("a");
        anchor.href = referrer;
        msg += "leave " + anchor.host + "!";
      }
      $(".referrer").text(msg);
      $("#downloadmessage").show();
    }

    if(callbacks.functionExists(callback)) {
      callback();
    }
  },
  
  /**
   * Determines whether a callback is defined before calling it.
   *
   * @param {function} callback Potentially a function.
   * @return {boolean} True if the parameter is a function, else false
   */
  functionExists: function(callback) {
    if (typeof callback === "function") {
      return true;
    }
    return false;
  }
};
