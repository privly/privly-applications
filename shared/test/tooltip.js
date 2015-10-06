/**
 * @fileOverview tests.js Gives testing code for the tooltip
 * that is displayed on injected content.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Tooltip Test Suite", function() {

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

  it("Does not result in an error", function() {
    privlyTooltip.tooltip();
    $("body")
      .trigger("mouseenter")
      .trigger("mousemove")
      .trigger("mouseleave");
  });
});
