/*global chrome */
/*global window, Privly:true, privlyNetworkService, privlyParameters, Promise */

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
  if (Privly.app.viewAdapter.SeamlessTTLSelect !== undefined) {
    return;
  }

  /**
   * The seamless-posting TTLSelect generic adapter.
   * 
   * @param {Object} application The Privly application instance
   */
  var SeamlessTTLSelectAdapter = function (application) {
    /**
     * The Privly application instance.
     * 
     * @type {Object}
     */
    this.application = application;

    this.started = false;

    this.sourceContextId = '';
    this.sourceResourceId = '';
    this.selfAppId = '';

    if (window.location.search.indexOf('?') === 0) {
      var query = privlyParameters.parameterStringToHash(window.location.search.substr(1));
      this.sourceContextId = query.contextid;
      this.sourceResourceId = query.resid;
      this.selfAppId = query.appid;
    }
  };

  // Inhreit EventEmitter
  Privly.EventEmitter.inherit(SeamlessTTLSelectAdapter);

  Privly.app.viewAdapter.SeamlessTTLSelect = SeamlessTTLSelectAdapter;

  /**
   * Promise wrapper for sending message to the background script
   * 
   * @return {Promise}
   */
  SeamlessTTLSelectAdapter.prototype.messageExtension = function (message, hasResponse) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    // specify which context to be received
    messageToSend.targetContextId = this.sourceContextId;
    messageToSend.targetResourceId = this.sourceResourceId;
    messageToSend.hasResponse = hasResponse;
    return Privly.message.messageExtension(messageToSend, hasResponse);
  };

  /**
   * Send message that the TTL has changed
   * @param  {String} ttlvalue Seconds until burn
   */
  SeamlessTTLSelectAdapter.prototype.msgTTLChange = function (ttlValue) {
    return this.messageExtension({
      action: 'posting/contentScript/TTLChanged',
      value: ttlValue
    });
  };

  /**
   * Send message that the TTL select app is ready
   * @param  {Object}
   *           {Number} width   App width
   *           {Number} height  App height
   * @return {Promise<Object>}
   *           {Boolean} isAboveButton
   *           {String}  selectedValue
   */
  SeamlessTTLSelectAdapter.prototype.msgAppReady = function (size) {
    return this.messageExtension({
      action: 'posting/contentScript/TTLSelectReady',
      size: size
    }, true);
  };

  /**
   * Get available TTL options from the Privly application.
   * 
   * @return {Promise<[Object]>}  TTL options
   *           {String} text      The text of the option
   *           {String} ttl       The seconds_util_burn value of the option
   *           {Boolean} default  Whether this option is the default option
   */
  SeamlessTTLSelectAdapter.prototype.getTTLOptions = function () {
    var promise;
    if (typeof this.application.getTTLOptions === 'function') {
      promise = this.application.getTTLOptions();
    } else {
      promise = Promise.resolve([]);
    }
    return promise;
  };

  SeamlessTTLSelectAdapter.prototype.onMessageReceived = function (message, sendResponse) {
    var self = this;
    switch (message.action) {
    case 'posting/app/initializeTTLSelect':
      self.initMenu(message.isAbove, message.selectedTTL, sendResponse);
      break;
    }
  };

  /**
   * Initialize the menu DOM
   * 
   * @param  {Boolean}  isAboveButton    Whether the menu is show above the button
   * @param  {String}   selectedTTLValue The current selected TTL value (optional)
   * @param  {Function} callback         Completion callback
   */
  SeamlessTTLSelectAdapter.prototype.initMenu = function (isAboveButton, selectedTTLValue, callback) {
    $('#menu').empty();
    this.getTTLOptions()
      .then(function (options) {
        var i;
        var nodes = [], selectedValueIndex = -1;

        // scan the options to get the index of the selected value
        if (selectedTTLValue !== null) {
          for (i = 0; i < options.length; ++i) {
            if (options[i].ttl === selectedTTLValue) {
              selectedValueIndex = i;
              break;
            }
          }
        }

        // then append other options
        for (i = 0; i < options.length; ++i) {
          if (selectedValueIndex === -1 && options[i].default) {
            selectedValueIndex = i;
          }
          nodes.push(options[i]);
        }

        // convert to HTML
        var htmlNodes = [], html;
        for (i = 0; i < nodes.length; ++i) {
          html = '<div class="posting-select-item';
          if (i === selectedValueIndex) {
            html += ' selected';
          }
          html += '" data-value="' + nodes[i].ttl + '">' + nodes[i].text + '</div>';
          htmlNodes.push(html);
        }

        if (isAboveButton) {
          htmlNodes = htmlNodes.reverse();
        }

        // set HTML
        $('#menu').html(htmlNodes.join(''));
      }).then(callback);
  };

  /**
   * when user clicks an item
   */
  SeamlessTTLSelectAdapter.prototype.onItemSelected = function (ev) {
    this.msgTTLChange(ev.target.getAttribute('data-value'));
  };

  /**
   * Start the seamless-posting-ttlselect adapter
   */
  SeamlessTTLSelectAdapter.prototype.start = function () {
    var self = this;
    if (self.started) {
      return;
    }
    self.started = true;

    // bind event listeners
    $(document).on('mousedown', '.posting-select-item', function (ev) {
      // prevent seamless-posting app losing focus
      ev.preventDefault();
    });
    $(document).on('click', '.posting-select-item', self.onItemSelected.bind(self));

    // receive incoming messages
    Privly.message.addListener(function (message, sendResponse) {
      if (message.targetAppId !== self.selfAppId) {
        return;
      }
      return self.onMessageReceived(message, sendResponse);
    });

    // tell the app that it is loaded
    this.getTTLOptions().then(function (options) {
      self.msgAppReady({
        width: 100,
        height: 25 * options.length
      });
    });
  };

}());