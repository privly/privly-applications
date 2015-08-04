/**
 * @fileOverview This script defines a tooltip to indicate that the content is
 * not a natural element of the page.
 *
 * Requirements: This script assumes the existence of the following CSS:
 *
 * body {
 *   cursor:pointer;
 * }
 *
 * #tooltip {
 *   position:absolute;
 *   border:1px solid #333;
 *   background:#f7f5d1;
 *   padding:1px 1px;
 *   color:#333;
 *   display:none;
 *   font:14px Helvetica;
 * }
 * .glyph_table {
 *   float: left;
 *   margin-right: 5px;
 * }
 **/


/**
 * @namespace
 * Wrapper for tooltip functions.
 */
var privlyTooltip = {

    /**
     * Message displayed by the tooltip.
     */
    tooltipMessage: "Read Only",

    /**
     * The name of the application to show in the tooltip.
     */
    appName: "",

    /**
     * Updates the tooltip's message.
     *
     * @param {string} dataDomain The domain controlling the content.
     * @param {string} newMessage The message to change the tooltip to. A
     * limited set of characters are accepted:
     * digits, word characters, underscores (\w) and whitespace (\s), periods,
     * and colons.
     *
     */
    updateMessage: function(dataDomain, newMessage){

      privlyTooltip.tooltipMessage = privlyTooltip.appName +
        ":\u00A0" +    // non-breaking space
        newMessage +
        ", from " +
        dataDomain;

      // Update the text node if it currently exists
      var textNodeDiv = document.getElementById("textNodeDiv");
      if( textNodeDiv ) {
        var tooltipTextNode = document.createTextNode(privlyTooltip.tooltipMessage);
        textNodeDiv.removeChild(textNodeDiv.firstChild);
        textNodeDiv.appendChild(tooltipTextNode);
      }
    },

    /**
     * Generate new glyph values.
     *
     * The generated string is not cryptographically secure and should not be used
     * for anything other than the glyph.
     */
    generateNewGlyph: function(){
      Privly.glyph.generateGlyph();
    },

    /**
     * Create and display the tooltip if the mouse is over the application.
     */
    tooltip: function(){

      // Create a new glyph if needed
      if (Privly.options.getGlyph() === null) {
        privlyTooltip.generateNewGlyph();
      }

      // Generate the glyph HTML and assign the color
      var glyph = Privly.glyph.getGlyphDOM();
      glyph.className = 'glyph_table';

      // Create the tooltip element
      var tooltipMessageElement = document.createElement("div");
      tooltipMessageElement.setAttribute("id", "tooltip");
      tooltipMessageElement.appendChild(glyph);

      // Add the message as a text node to the tooltip element
      var messageDiv = document.createElement("div");
      messageDiv.setAttribute("id", "textNodeDiv");
      var tooltipTextNode = document.createTextNode(privlyTooltip.tooltipMessage);
      messageDiv.appendChild(tooltipTextNode); // So we can refer to this later.
      tooltipMessageElement.appendChild(messageDiv);

      // Offsets from the cursor so we can see where we are pointed
      var xOffset = 7;
      var yOffset = 10;

      var bodyElement = document.getElementsByTagName("body")[0];

      // Display the tooltip when hovering
      bodyElement.addEventListener('mouseenter',
        function(e){
            bodyElement.appendChild(tooltipMessageElement);

            // Update the message since it may have changed.
            var textNodeDiv = document.getElementById("textNodeDiv");
            var tooltipTextNode = document.createTextNode(privlyTooltip.tooltipMessage);
            textNodeDiv.removeChild(textNodeDiv.firstChild);
            textNodeDiv.appendChild(tooltipTextNode);

            var t = document.getElementById("tooltip");
            t.style.top = (e.clientY - xOffset) + "px";
            t.style.left = (e.clientX + yOffset) + "px";
          });

      // Remove the tooltip when the mouse leaves the app
      bodyElement.addEventListener('mouseleave',
        function(e){
            if ( ! bodyElement.contains(e.toElement) ) {
              var t = document.getElementById("tooltip");
              t.parentNode.removeChild(t);
            }
          });

      // Move the tooltip when the mouse moves
      bodyElement.addEventListener('mousemove',
        function(e){
            var t = document.getElementById("tooltip");
            t.style.top = (e.clientY - xOffset) + "px";
            t.style.left = (e.clientX + yOffset) + "px";
          });
    }
    
};
