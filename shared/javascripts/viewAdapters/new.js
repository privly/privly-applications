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
 * individual privly-applications. For example, see new.js in the PlainPost
 * Privly Application.
 *
 * ## Expected Elements ##
 * This adapter expects the DOM to have a set of elements
 *
 * '#loadingDiv': This will be shown whenever an AJAX request is pending
 * '#messages': This shows UI messages to the user.
 * '#login_message': This shows a login error message to the user.
 * '#save': This is the submit button for the form.
 * '#form': This is the form the user enters content into.
 * '.privlyUrl': The text with the Privly-type URLs.
 * '#content")[0]': The content area that accepts user text.
 *
 * ## Extending this script ##
 * See Message/js/messageApp.js and Message/js/new.js for examples.
 *
 **/
/*global privlyNetworkService, window */
// If Privly namespace is not initialized, initialize it
var Privly;
if (Privly === undefined) {
  Privly = {};
}
if (Privly.app === undefined) {
  Privly.app = {};
}
if (Privly.app.viewAdapter === undefined) {
  Privly.app.viewAdapter = {};
}

(function () {
  // If this file is already loaded, don't do it again
  if (Privly.app.viewAdapter.New !== undefined) {
    return;
  }

  /**
   * These applications can be placed into the following states:
   * 1. Pending Login Check: The app is currently requesting the CSRF
   *    token from the remote server.
   * 2. Failure to login: The user is not currently authenticated with the
   *    remote server. In this state the user is prompted to login.
   * 3. Pending post: The user can make the post at this point.
   * 4. postSubmit: The user submitted the form so the content is being
   *    sent to the remote server. Once it is returned, the URL will
   *    be messaged to the extension (if present) by calling the
   *    "postCompleted" function.
   * 5. Error creating post: The remote server would not accept the user's
   *    content. The app should display an error message.
   * 6. Completed post: The remote server has returned a URL. This app should
   *    display it and fire the URL event.
   */
  var NewAdapter = function (application) {
    /**
     * The Privly application instance.
     * 
     * @type {Object}
     */
    this.application = application;

    /**
     * Whether the adapter is started
     * 
     * @type {Boolean}
     */
    this.started = false;
  };

  // Inhreit EventEmitter
  Privly.EventEmitter.inherit(NewAdapter);

  Privly.app.viewAdapter.New = NewAdapter;

  /**
   * Method factory. Add overridable function to NewAdapter.
   * It will create a function which behavior can be overridden by
   * listening `before{name}` event and `after{name}` event.
   * 
   * @param {String} name The name of the function.
   * @param {Function} func The body of the function if `before` event
   * doesn't return true=preventDefault.
   */
  var addOverridableFunction = function (name, func) {
    var eventName = name.substr(0, 1).toUpperCase() + name.substr(1);
    NewAdapter.prototype[name] = function () {
      var self = this;
      var argv = [].slice.call(arguments);
      return self
        .emitAsync.apply(self, ['before' + eventName].concat(argv))
        .then(function (preventDefault) {
          if (preventDefault === true) {
            return;
          }
          return func.apply(self, argv);
        })
        .then(function () {
          return self.emitAsync.apply(self, ['after' + eventName].concat(argv));
        });
    };
  };

  /**
   * Start the creation process adapter.
   * It will create the default navigation bar, assign ajax request listeners and
   * finally call `pendingLogin()` to start the login checking process.
   *
   * @return {Promise}
   */
  NewAdapter.prototype._start = function () {
    var self = this;
    if (self.started) {
      return;
    }
    self.started = true;

    // Set the nav bar to the proper domain
    privlyNetworkService.initializeNavigation();

    // Add listeners to show loading animation while making ajax requests
    $(document).ajaxStart(function () {
      $('#loadingDiv').show();
    });
    $(document).ajaxStop(function () {
      $('#loadingDiv').hide();
    });

    self.pendingLogin();
  };
  addOverridableFunction('start', NewAdapter.prototype._start);

  /**
   * When server connection checking succeeded.
   * It will add event listeners to the submit button and
   * make textarea able to auto resize. Finally it will call
   * `pendingPost()` to prepare the posting form.
   *
   * @return {Promise}
   */
  NewAdapter.prototype._connectionSucceeded = function () {
    var self = this;

    // Monitor the submit button
    $(document).on('click', '#save', self.save.bind(self));

    // Make all text areas auto resize to show all their contents
    $('textarea').autosize();

    self.pendingPost();
  };
  addOverridableFunction('connectionSucceeded', NewAdapter.prototype._connectionSucceeded);

  /**
   * When server connection checking failed.
   * It will call `loginFailure()` to show error messages.
   *
   * @return {Promise}
   */
  NewAdapter.prototype._connectionFailed = function () {
    var self = this;
    self.loginFailure();
  };
  addOverridableFunction('connectionFailed', NewAdapter.prototype._connectionFailed);

  /**
   * Get processed request content from the Privly application.
   * 
   * @param  {String} content
   * @return {Promise<Object>}
   *           {String} content
   *           {String} structured_content
   *           {Boolean} isPublic
   */
  NewAdapter.prototype.getRequestContent = function (content) {
    var promise;
    if (typeof this.application.getRequestContent === 'function') {
      promise = this.application.getRequestContent(content);
    } else {
      promise = Promise.resolve({});
    }
    return promise.then(function (reqContent) {
      if (reqContent.content === undefined) {
        reqContent.content = content;
      }
      if (reqContent.structured_content === undefined) {
        reqContent.structured_content = content;
      }
      if (reqContent.isPublic === undefined) {
        reqContent.isPublic = true;
      }
      return reqContent;
    });
  };

  /**
   * Get processed Privly link from the Privly application.
   * Privly application may manipulate the url to add additional
   * information.
   * 
   * @param  {String} link
   * @return {Promise<String>} The processed link
   */
  NewAdapter.prototype.postprocessLink = function (link) {
    var promise;
    if (typeof this.application.postprocessLink === 'function') {
      promise = this.application.postprocessLink(link);
    } else {
      promise = Promise.resolve(link);
    }
    return promise;
  };

  /**
   * Submit the content to the remote server.
   * 
   * @return {Promise}
   */
  NewAdapter.prototype._save = function () {
    var self = this;
    return self
      .getRequestContent($("#content")[0].value)
      .then(function (json) {
        self.postSubmit(
          json.structured_content,
          self.application.name,
          $("#seconds_until_burn").val(),
          json.content
        );
      });
  };
  addOverridableFunction('save', NewAdapter.prototype._save);

  /**
   * Start login process. It will call `connectionSucceeded()` when
   * the checking is passed and call `connectionFailed()` in other
   * cases.
   *
   * @return {Promise}
   */
  NewAdapter.prototype._pendingLogin = function () {
    var self = this;

    Privly.storage.set("Login:redirect_to_app", window.location.href);
    privlyNetworkService.initPrivlyService(
      privlyNetworkService.contentServerDomain(),
      self.connectionSucceeded.bind(self),
      self.connectionFailed.bind(self),
      self.connectionFailed.bind(self)
    );
  };
  addOverridableFunction('pendingLogin', NewAdapter.prototype._pendingLogin);

  /**
   * Prompt the user to sign into their server. This assumes the remote
   * server's sign in endpoint is at "/users/sign_in".
   *
   * @return {Promise}
   */
  NewAdapter.prototype._loginFailure = function () {
    privlyNetworkService.showLoggedOutNav();
    $("#messages").hide();
    $("#login_message").show();
  };
  addOverridableFunction('loginFailure', NewAdapter.prototype._loginFailure);

  /**
   * Tell the user they can create their post by updating the UI.
   *
   * @return {Promise}
   */
  NewAdapter.prototype._pendingPost = function () {
    privlyNetworkService.showLoggedInNav();
    $("#save").prop('disabled', false);
    $("#messages").toggle();
    $("#form").toggle();
  };
  addOverridableFunction('pendingPost', NewAdapter.prototype._pendingPost);

  /**
   * Submit the posting form and await the return of the post.
   *
   * @param {json} structured_content The JSON the application
   * needs to store.
   * @param {string} privly_application The name of the Privly application
   * generating the content.
   * @param {int} seconds_until_burn The number of seconds until this
   * content should be destroyed by the server.
   * @param {string} content A markdown string. This will likely
   * be deprecated in the future.
   * @return {Promise}
   */
  NewAdapter.prototype._postSubmit = function (structured_content, privly_application, seconds_until_burn, content) {
    var self = this;

    $("#save").prop('disabled', true);

    var contentToPost = {
      post: {
        "content": content,
        "structured_content": structured_content,
        "privly_application": privly_application,
        "seconds_until_burn": seconds_until_burn,
        "public": true
      },
      "format": "json"
    };

    // Send the post
    privlyNetworkService.sameOriginPostRequest(
      privlyNetworkService.contentServerDomain() + "/posts",
      function (response) {
        var url = response.jqXHR.getResponseHeader("X-Privly-Url");
        self.postprocessLink(url).then(function (url) {
          self.postCompleted(response, url);
        });
      },
      contentToPost
    );
  };
  addOverridableFunction('postSubmit', NewAdapter.prototype._postSubmit);

  /**
   * Tell the user that there was a problem.
   *
   * @param {jqXHR} response The AJAX response from the server.
   * @return {Promise}
   */
  NewAdapter.prototype._createError = function (response) {
    $("#save").prop('disabled', false);
    $("#messages").text("There was an error creating your post. Status: " + response.jqXHR.status);
    $("#messages").show();
  };
  addOverridableFunction('createError', NewAdapter.prototype._createError);

  /**
   * Send the URL to the extension or mobile device if it exists and display
   * it to the end user.
   *
   * @param {jqXHR} response The AJAX response from the server.
   * @param {string} url The injectable URL for the Privly Application.
   * @return {Promise}
   */
  NewAdapter.prototype._postCompleted = function (response, url) {
    $("#save").prop('disabled', false);

    if (response.jqXHR.status === 201 && url !== undefined && url !== "") {
      Privly.message.messageExtension({privlyUrl: url});

      $("#copy_message").show();

      $('#local_address').attr("href", url);
      if (privlyNetworkService.platformName() !== "HOSTED") {
        var localCodeURL = "show.html?privlyOriginalURL=" + encodeURIComponent(url);
        $('#local_address').attr("href", localCodeURL);
      }

      $(".privlyUrl").text(url);
      $(".privlyUrl").css("cursor", "pointer");
      $(".privlyUrl").click(function () {
        var range, selection;

        if (window.getSelection && document.createRange) {
          selection = window.getSelection();
          range = document.createRange();
          range.selectNodeContents($(this)[0]);
          selection.removeAllRanges();
          selection.addRange(range);
        } else if (document.selection && document.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText($(this)[0]);
          range.select();
        }
        $(".open-app-button").show();
      });
    }
  };
  addOverridableFunction('postCompleted', NewAdapter.prototype._postCompleted);

}());
