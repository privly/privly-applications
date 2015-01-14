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
   var $reference = jQuery('<div/>', {
       'data-canonical-href': 'https://priv.ly/posts/2?privlyApp=PlainPost#privlyInject1',
       'class': 'btn btn-default preview_link'
   });
   historyModal.eventHandlers.iframeReturn($reference);
   historyModal.eventHandlers.prevPreview();
   historyModal.eventHandlers.nextPreview();
   historyModal.eventHandlers.destroyLink();

   privlyNetworkService.sameOriginDeleteRequest = function(){};
   historyModal.eventHandlers.confirmDestruction();
 });
});
