/**
 * @fileOverview This script defines a tooltip to indicate that the content is
 * not a natural element of the page.
 * 
 * Requirements: This script assumes the existence of the following CSS:
 *
 * body {
 * cursor:pointer;
 * }
 *
 * #tooltip {
 * position:absolute;
 * border:1px solid #333;
 * background:#f7f5d1;
 * padding:1px 1px;
 * color:#333;
 * display:none;
 * font:14px Helvetica;
 * }
 * .glyph_empty {background-color:#ffffff;}
 *
 * .glyph_table {
 *  border-collapse: collapse;
 *  line-height: 4px;
 *  float: left;
 *  margin-right: 5px;
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

      privlyTooltip.tooltipMessage = privlyTooltip.appName
        + ":\u00A0" // non-breaking space
        + newMessage
        + ", from "
        + dataDomain;

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
      
      var glyphString, glyphColor;
      glyphColor = Math.floor(Math.random()*16777215).toString(16);
      glyphString = ((Math.random() < 0.5) ? "false" : "true");
      for(i = 0; i < 14; i++) {
        glyphString += "," + ((Math.random() < 0.5) ? "false" : "true");
      }

      ls.setItem("glyph_cells", glyphString);
      ls.setItem("glyph_color", glyphColor);
    },
    
    /**
     * Create and display the tooltip if the mouse is over the application.
     */
    tooltip: function(){

      // Create a new glyph if needed
      var glyphCells, glyphColor;
      if (ls.getItem("glyph_cells") === undefined) {
        privlyTooltip.generateNewGlyph();
      }
      glyphString = ls.getItem("glyph_cells");
      glyphColor = ls.getItem("glyph_color");

      // Generate the glyph HTML and assign the color
      var glyph = privlyTooltip.glyphHTML();

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
    },
    
    /**
     * Constructs the user's security glyph, which indicates whether the 
     * injected content is trusted. The Glyph is assumed to be defined by the
     * extension before this script is run. It can be reset via the options
     * interface.
     *
     * The glyph is currently defined by a string in local storage keyed by
     * "privly_glyph". The glyph is a series of hex colors stated without the
     * leading hash sign, and separated by commas.
     *
     * eg: ffffff,f0f0f0,3f3f3f
     *
     * @return {string} An HTML table of the glyph.
     *
     */
    glyphHTML: function() {
      
      // Get the glyph from storage
      var glyphString = ls.getItem("glyph_cells");
      var glyphArray = glyphString.split(",");
      var glyphColor = ls.getItem("glyph_color");

      // Construct the 5x5 table that will represent the glyph.
      // Its 3rd column is the axis of symmetry
      var table = document.createElement("table");
      table.setAttribute("class", "glyph_table");
      table.setAttribute("dir", "ltr");
      table.setAttribute("width", "30");
      table.setAttribute("border", "0");
      table.setAttribute("summary", "Privly Visual Security Glyph");

      var tbody = document.createElement("tbody");

      for(i = 0; i < 5; i++) {
        var tr = document.createElement("tr");

        for(j = 0; j < 5; j++) {
          var td = document.createElement("td");

          // Add a non-breaking space
          var nbs = document.createTextNode("\u00A0");
          td.appendChild(nbs);

          // Fill only the first three columns with the coresponding values from glyphArray[]
          // The rest of two columns are simetrical to the first two
          if(j <= 2) {
            if(glyphArray[i * 3 + j] == "true") {
              td.setAttribute("class", "glyph_fill");
              td.setAttribute("style", "background-color:#"+glyphColor);
            } else {
              td.setAttribute("class", "glyph_empty");
            }
          } else {
            if(glyphArray[i * 3 + (5 % (j + 1))] == "true") {
              td.setAttribute("class", "glyph_fill");
              td.setAttribute("style", "background-color:#"+glyphColor);
            } else {
              td.setAttribute("class", "glyph_empty");
            }
          }
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      
      return table;
    }
};
