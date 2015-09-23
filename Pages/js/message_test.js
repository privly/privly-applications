/**
 * @fileOverview This is the script file of MessageTest.html, provides
 * basic ping-pong feature which will be used to test context messenger.
 */

$(document).ready(function () {

  function appendPongResponse(pong) {
    var $container = $('<div class="response"></div>');
    ['action', 'timestamp', 'platform', 'context', 'location', 'data'].forEach(function (field) {
      $('<div class="response-' + field + ' response-item"></div>').text(pong[field]).appendTo($container);
    });
    var responseText;
    if (pong.platform === "FIREFOX" && pong.context === "BACKGROUND_SCRIPT") {
      // location isn't defined for Firefox extension background scripts.
      responseText = pong.action + '/' + pong.context + '/' + pong.data;
    } else {
      responseText = pong.action + '/' + pong.context + '/' + pong.data + '/' + pong.location;
    }
    $('<div class="response-target response-item"></div>').text(responseText).appendTo($container);
    $container.appendTo('#response');
  }

  $('[name="clear"]').click(function () {
    $('#response').empty();
  });

  [
    {button: "to_extension", action: 'messageExtension'},
    {button: "to_content_script", action: 'messageContentScripts'},
    {button: "to_privly_app", action: 'messagePrivlyApplications'}
  ].forEach(function (test) {

    $('[name="' + test.button + '"]').click(function () {
      Privly.message[test.action]({
        name: test.action,
        action: 'ping',
        data: $('[name="data"]').val()
      }, true).then(appendPongResponse);

      Privly.message[test.action]({
        name: test.action,
        action: 'pingAsync',
        data: $('[name="data"]').val()
      }, true).then(appendPongResponse);

      $('[name="data"]').val('');
    });

  });

});
