/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Tooltip Test Suite", function() {

  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("updates the message", function() {
    privlyTooltip.updateMessage("data domain", "tested");
    expect(privlyTooltip.tooltipMessage).toBe(": tested, from data domain");

    var textNodeDiv = document.createElement("div");
    textNodeDiv.setAttribute("id", "textNodeDiv");

    var tooltipTextNode = document.createTextNode("tmp");
    textNodeDiv.appendChild(tooltipTextNode);

    var bodyElement = document.getElementsByTagName("body")[0];
    bodyElement.appendChild(textNodeDiv);

    privlyTooltip.updateMessage("data domain", "tested");

    expect($(textNodeDiv).text()).toBe(": tested, from data domain");
  });

  it("removes tooltip when mouse leaves app", function() {
    privlyTooltip.tooltip();
    var tooltip = $('<div/>', {
      id: "tooltip"
    });
    $(document.body).append(tooltip);
    expect($("#tooltip").length).toBe(1);
    privlyTooltip.mouseleaveListener({});
    expect($("#tooltip").length).toBe(0);
  });

  it("updates tooltip position when mouse enters", function() {
    privlyTooltip.tooltip();
    var tooltip = $('<div/>', {
      id: "tooltip"
    });
    $(document.body).append(tooltip);
    privlyTooltip.mouseenterListener({clientY: 123, clientX: 321});

    // todo, figure out why these fail on Safari
    // https://github.com/privly/privly-safari/issues/45
    if( navigator.userAgent.indexOf("Safari") === -1 ) {
      expect(tooltip.css("top")).toBe("116px");
      expect(tooltip.css("left")).toBe("331px");
    }
  });

  it("updates tooltip position when mouse moves", function() {
    privlyTooltip.tooltip();
    var tooltip = $('<div/>', {
      id: "tooltip"
    });
    $(document.body).append(tooltip);
    privlyTooltip.mousemoveListener({clientY: 123, clientX: 321});

    // todo, figure out why these fail on Safari
    // https://github.com/privly/privly-safari/issues/45
    if( navigator.userAgent.indexOf("Safari") === -1 ) {
      expect(tooltip.css("top")).toBe("116px");
      expect(tooltip.css("left")).toBe("331px");
    }
  });

});
