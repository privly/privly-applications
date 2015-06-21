$(document).ready(function () {

  function appendPongResponse(pong) {
    var $container = $('<div class="response"></div>');
    ['action', 'timestamp', 'platform', 'context', 'location', 'data'].forEach(function (field) {
      $('<div class="response-' + field + ' response-item"></div>').text(pong[field]).appendTo($container);
    });
    $('<div class="response-target response-item"></div>').text(pong.action + '/' + pong.context + '/' + pong.data + '/' + pong.location).appendTo($container);
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
        action: 'ping',
        data: $('[name="data"]').val()
      }, true).then(appendPongResponse);

      Privly.message[test.action]({
        action: 'pingAsync',
        data: $('[name="data"]').val()
      }, true).then(appendPongResponse);

      $('[name="data"]').val('');
    });

  });

  

});