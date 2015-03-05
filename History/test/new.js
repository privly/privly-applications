/**
 * @fileOverview tests.js Gives testing code for the new page.
 * This spec is managed by the Jasmine testing library.
 *
 * More information on testing:
 * https://github.com/privly/privly-organization/wiki/Testing
 *
 **/

/**
 * Helper function for resetting the state of the application to the initial
 * state of the app. Since the application first checks its status with the
 * remote server, this function blocks execution until it knows the app is
 * intialized or there was likely an error. 
 *
 * @param {boolean} loggedOut Indicates whether the user should be logged out
 * of the app (true) or logged into the app
 */
function initializeApp(loggedOut) {
  
  // used to check if asynchronous calls completed
  var initializationFlag = false;
  
  //clear the table
  var table = $.fn.dataTable.fnTables(true);
  if( table.length > 0 )
    $(table[0]).dataTable().fnDestroy(false);
  $("#table_body").children().remove();
  
  if(loggedOut) {
  
    //log the user out
    var domain = privlyNetworkService.contentServerDomain();
    privlyNetworkService.authToken = "auth_token=pE8dHprCJ79QENLedELx";
    $.post(domain + "/users/sign_out", "_method=delete", function(data) {
      privlyNetworkService.authToken = "";
      callbacks.pendingLogin();
    });
  } else {
  
    // Log the user in using the auth token for the user
    // danger.dont.use.bork.bork.bork@privly.org
    // You must create this user and assign it the auth token as
    // below
    privlyNetworkService.authToken = "auth_token=pE8dHprCJ79QENLedELx";
    callbacks.pendingLogin();
  }
  
  setTimeout(function() {
    if($('#loadingDiv').is(":hidden")) initializationFlag = true;
  }, 900);
}

var keys = Object.keys(__html__);
var selectKey;
keys.forEach(function(key) {
  if( key.indexOf("History/new.html") >= 0 ) {
    selectKey = key;
  }
});

// WARNING: These tests require the existence of an authentication_token
// equal to: "pE8dHprCJ79QENLedELx"
describe ("History Logged In New Suite", function() {
  
  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    document.body.innerHTML = __html__[selectKey];
    initializeApp(false);
  });

  it("initializes properly", function() {

    // Should initialize the navigation
    callbacks.pendingLogin();
    var domain = privlyNetworkService.contentServerDomain();

    if( privlyNetworkService.platformName() !== "HOSTED" ) {

      // if the app is not hosted, the user should first be directed to the
      // content_server page of the app bundle.
      expect($(".home_domain").attr("href")).toBe('../Help/content_server.html');
    } else {

      // if the application is hosted, the URL should connect to the domain's root
      expect($(".home_domain").attr("href")).toBe("http://" + window.location.href.split("/")[2]);
    }
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
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

describe ("History Logged out New Suite", function() {
  
  // Get an HTML document defined by the pre-processor.
  // This is a rough hack because HTML2JS seems to assign the
  // key to the absolute URL, which is not reliable on
  // continuous integration.
  beforeEach(function() {
    document.body.innerHTML = __html__[selectKey];
    initializeApp(true);
  });
  
  it("initializes properly", function() {

    // Should initialize the navigation
    callbacks.pendingLogin();
    var domain = privlyNetworkService.contentServerDomain();

    if( privlyNetworkService.platformName() !== "HOSTED" ) {

      // if the app is not hosted, the user should first be directed to the
      // content_server page of the app bundle.
      expect($(".home_domain").attr("href")).toBe('../Help/content_server.html');
    } else {

      // if the application is hosted, the URL should connect to the domain's root
      expect($(".home_domain").attr("href")).toBe("http://" + window.location.href.split("/")[2]);
    }
    expect(domain.split("/")[2]).toBe($(".home_domain").text());
  });
  
  it("does not result in an error", function() {
    resizeIframePostedMessage({data: "1,1"});
    expect(true).toBe(true);
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
