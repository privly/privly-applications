/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 *
 * More information on testing:
 * https://github.com/privly/privly-organization/wiki/Testing
 *
 **/

describe ("History New Suite", function() {

   // Create the expected DOM
   beforeEach(function() {
     var domIDs = [
       "current_content_server",
       "remote_content_server",
       "messages",
       "login_message",
       "refresh_link",
       "logout_link",
       "form",
       "table_body",
       "home_domain"
     ];
     domIDs.forEach(function(id){
       var newElement = $('<a/>', {
         id: id,
         "class": id
       });
       $(document.body).append(newElement);
     });
   });

   // Remove the expected DOM
   afterEach(function() {
     document.body.innerHTML = "";
   });

   it("initializes properly", function() {

     // Save the callbacks for restoration at the end of the test
     var oldInit = privlyNetworkService.initPrivlyService;
     privlyNetworkService.initPrivlyService = function(){};

     // Call the test
     callbacks.pendingLogin();

     expect(Privly.storage.get("Login:redirect_to_app")).toBe(window.location.href);

     if( privlyNetworkService.platformName() !== "HOSTED" ) {

       // if the app is not hosted, the user should first be directed to the
       // content_server page of the app bundle.
       expect($(".home_domain").attr("href")).toBe('../Help/content_server.html');
     } else {

       // if the application is hosted, the URL should connect to the domain's root
       expect($(".home_domain").attr("href")).toBe("http://" + window.location.href.split("/")[2]);
     }

     var domain = privlyNetworkService.contentServerDomain();
     expect(domain.split("/")[2]).toBe($(".home_domain").text());

     // Restore the callback for the other tests
     privlyNetworkService.initPrivlyService = oldInit;
   });

   it("does not result in an error", function() {
     resizeIframePostedMessage({data: "1,1"});
     expect(true).toBe(true);
   });

   it("fills the history array", function() {

     // Exemple of output
     var data = {
       json: [
         {
           created_at: "Mar 01 2015",
           burn_after_date: "Mar 10 2015",
           updated_at: "Mar 05 2015",
           privly_URL: "testUrl",
           privly_application: "Tester"
         },
         {
           created_at: "Mar 01 2014",
           burn_after_date: "Mar 10 2014",
           updated_at: "Mar 05 2014",
           privly_URL: "testUrl2",
           privly_application: "Tester2"
         }
       ]
     };

     callbacks.postCompleted(data);

     // Check existence
     expect(jQuery("#table_body tr").length).toBe(2);
     expect(jQuery("#table_body tr:first td").length).toBe(4);
     expect(jQuery("#table_body tr:first td:first button").length).toBe(2);

     // Check content
     var cells = jQuery("#table_body tr:first td");
     var buttons = jQuery(cells[0]).children("button");

     expect(buttons[0].getAttribute("data-target")).toBe("#historyPreview");
     expect(buttons[0].textContent).toMatch(/Preview Tester/);
     expect(buttons[1].getAttribute("data-canonical-href")).toMatch(/show.html\?privlyOriginalURL\=testUrl/);

     for(var i = 1; i <= 3; i++) {
       expect(cells[i].textContent).not.toBe(""); // TODO unit tests for parseDate
     }

   });

});

describe("History side functions", function() {
  describe("getMessageDOM", function() {
    it("transforms a single JSON object to DOM array row", function() {

      var data = {
        created_at: "Mar 01 2015",
        burn_after_date: "Mar 10 2015",
        updated_at: "Mar 05 2015",
        privly_URL: "testUrl",
        privly_application: "Tester"
      };

      var DOM = getMessageDOM(data);
      var cells = jQuery(DOM).children("td");

      // Check existence
      expect(jQuery(cells[0]).children("button").length).toBe(2);
      expect(cells.length).toBe(4);

      // Check content
      expect(jQuery(cells[0]).children("button")[0].textContent).toMatch(/Preview Tester/);
      for(var i = 1; i <= 3; i++) {
        expect(cells[i].textContent).not.toBe("");
      }

    });
  });
});
