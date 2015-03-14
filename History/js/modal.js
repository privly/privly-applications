/* global privlyParameters:false */

/**
 * Adds a modal box for previewing content on the History application.
 */
var historyModal = {

  /**
   * The events handlers required by the modal
   * for opening the modal, closing it, and interacting
   * with content in the modal.
   */
  eventHandlers: {

    /**
     * stores the reference of the preview button clicked to bring
     * up the modal box.
     */
    buttonClicked: undefined,

    /**
     * Stores the reference of destroy button clicked.
     */
    destroybuttonClicked: undefined,

    /**
     * Add 'cell-border' class when the window has a width smaller than 768px
     */
    resize: function() {
      if($(window).width() < 768) {
        $('#posts').addClass("cell-border");
      } else {
        $('#posts').removeClass("cell-border");
      }
    },

    /**
     * Takes reference of the button, retrieves the data and puts into iframe for displaying.
     * @param {jquery} $reference a reference to the button clicked for the modal.
     */
    iframeReturn: function($reference) {

      var iFrame = document.createElement('iframe');

      // Styling and display attributes that mirror those
      // of the privly.js content script
      iFrame.setAttribute("frameborder","0");
      iFrame.setAttribute("vspace","0");
      iFrame.setAttribute("hspace","0");
      iFrame.setAttribute("width","100%");
      iFrame.setAttribute("marginwidth","0");
      iFrame.setAttribute("marginheight","0");
      iFrame.setAttribute("height","1px");
      iFrame.setAttribute("frameborder","0");
      iFrame.setAttribute("style","width: 100%; height: 32px; " +
        "overflow: hidden;");
      iFrame.setAttribute("scrolling","no");
      iFrame.setAttribute("overflow","hidden");
      iFrame.setAttribute("data-privly-accept-resize","true");

      // The href of the original link as dictated by the remote server
      var canonicalHref = $reference.attr("data-canonical-href");
      iFrame.setAttribute("data-canonical-href", canonicalHref);

      //Set the source URL
      iFrame.setAttribute("src", canonicalHref);

      //The id and the name are the same so that the iframe can be
      //uniquely identified and resized by resizeIframePostedMessage()
      iFrame.setAttribute("id", "ifrm0");
      iFrame.setAttribute("name", "ifrm0");

      // Clear the old iframe and insert the new one
      $(".privly_iframe").empty();
      $(".privly_iframe").append(iFrame);
    },

    /**
     * Take the reference of the button that was clicked and pass to iframeReturn function.
     */
    previewLink: function() {
      historyModal.eventHandlers.buttonClicked = $(this);
      historyModal.eventHandlers.iframeReturn(historyModal.eventHandlers.buttonClicked);
    },

    /**
     * Get the reference of button previous to the one who's data is displayed and call iframeReturn function.
     * 'buttonClicked' variable basically stores the 'Preview ZeroBin/PlainPost' button whose corresponding
     * data is being displayed in the lightbox.
     */
    prevPreview: function() {

      //finds the previous button with preview_link class and passes its reference.
      //a small example of why this works : http://jsfiddle.net/5QdgB/
      var index = $('.preview_link').index(historyModal.eventHandlers.buttonClicked);
      var previous = $('.preview_link').slice(index-1).first();
      historyModal.eventHandlers.buttonClicked = previous;
      historyModal.eventHandlers.iframeReturn(previous);
    },

    /**
     * Get the reference of button next to the one who's data is displayed and call iframeReturn function.
     * If the user is currently viewing the last message, and clicks on 'Next'
     * roll back up to the first message (index = 0) and display that.
     */
    nextPreview: function() {

      //finds the next button with preview_link class and passes its reference.
      var index = $('.preview_link').index(historyModal.eventHandlers.buttonClicked);
      if(index === $('.preview_link').length - 1){
        index = -1; //rolling back to the first message after the last.
      }
      var next = $('.preview_link').slice(index+1).first();
      historyModal.eventHandlers.buttonClicked=next;
      historyModal.eventHandlers.iframeReturn(next);
    },

    /**
     * Remembers the button that was clicked for destroying content.
     * A seconday confirmation modal is opened by the jquery API and
     * is not specified in this Javascript.
     */
    destroyLink: function() {
      destroyButtonClicked = $(this);
    },

    /**
     * The user confirmed the destruction dialog so the content is destroyed.
     */
    confirmDestruction: function() {
      var url = privlyParameters.getApplicationUrl($("iframe").attr("data-canonical-href"));
      var dataURL =  privlyParameters.getParameterHash(url).privlyDataURL;
      privlyNetworkService.sameOriginDeleteRequest(
        dataURL,
        function(response) {
            if( response.jqXHR.status === 200 ) {
              var tr = historyModal.eventHandlers.buttonClicked.closest('tr');
              tr.hide();
            }
        }, {});
      $('#historyPreview').modal('hide');
      $('#confirmBox').modal('hide');
    }
  },

  /**
   * Register all the event handlers for the modal.
   */
  initialize: function() {

    $(window).resize(historyModal.eventHandlers.resize);
    $('button#prev_preview').on('click',
      historyModal.eventHandlers.prevPreview);
    $('button#next_preview').on('click',
      historyModal.eventHandlers.nextPreview);
    $('button.preview_link').on('click',
      historyModal.eventHandlers.previewLink);
    $('#destroy_link').on('click',
      historyModal.eventHandlers.destroyLink);
    $("#ok_confirm").on('click',
      historyModal.eventHandlers.confirmDestruction);
  }
};
