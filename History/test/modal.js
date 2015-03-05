/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 *
 * More information on testing:
 * https://github.com/privly/privly-organization/wiki/Testing
 *
 **/

describe ("History Application Modal Box Suite", function() {

 it("does not result in an error", function() {

   // Construct the elements expected by the event handler
   var $reference = jQuery('<div/>', {
       'data-canonical-href':
         'https://priv.ly/posts/2?privlyApp=PlainPost#privlyInject1',
       'class': 'btn btn-default preview_link'
   });
   var iframe = jQuery('<div/>', {
     'class': 'privly_iframe'
   });
   document.body.appendChild(iframe[0]);
   historyModal.eventHandlers.iframeReturn($reference);

   // Call each of the event handlers in turn
   historyModal.eventHandlers.prevPreview();
   historyModal.eventHandlers.nextPreview();
   historyModal.eventHandlers.destroyLink();

   // The "confirmDestruction" function uses an AJAX request.
   // To properly isolate this unit we replace the AJAX function
   // with an empty function. Now the unit will not attempt to
   // actually destroy content.
   privlyNetworkService.sameOriginDeleteRequest = function(){};
   historyModal.eventHandlers.confirmDestruction();
 });
});
