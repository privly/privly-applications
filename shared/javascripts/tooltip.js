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
 *
 * This script assumes that jquery is defined, but this dependency will
 * be stripped in future versions. Content intended for injection should have
 * a minimum footprint, so defining the jquery library is too expensive.
 *
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
      var message = newMessage.replace(/[^\w\s.:]/gi, '');
      var domain = dataDomain.replace(/[^\w\s.:]/gi, '');
      privlyTooltip.tooltipMessage = privlyTooltip.appName + ":<br />" + message + "<br />" + domain;
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

      if ( privlyNetworkService.platformName() === "FIREFOX" ) {
        var firefoxPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefService)
                              .getBranch("extensions.privly.");
        firefoxPrefs.setCharPref("glyph_cells", glyphString);
        firefoxPrefs.setCharPref("glyph_color", glyphColor);
      } else {
        localStorage["glyph_cells"] = glyphString;
        localStorage["glyph_color"] = glyphColor;
      }
      
    },
    
    /**
     * Tooltip script 
     * powered by jquery (http://www.jquery.com)
     * written by Alen Grakalic (http://cssglobe.com)
     * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
     */
    tooltip: function(){
      
      var glyph = privlyTooltip.glyphHTML();
      var tooltipMessageElement = document.createElement("div");

      tooltipMessageElement.setAttribute("id", "tooltip");
      tooltipMessageElement.appendChild(glyph);
      tooltipMessageElement.appendChild(document.createTextNode(privlyTooltip.tooltipMessage));
      
      var xOffset = 7;
      var yOffset = 10;

      // Retrive the html string from the JS object 'glyph'
      var html = $("<div>").append($(glyph).clone()).remove().html();

      jQuery("body").hover(function(e){
        jQuery("body").append(tooltipMessageElement);
        jQuery("#tooltip").css("top", (e.pageY - xOffset) + "px")
                          .css("left", (e.pageX + yOffset) + "px")
                          .fadeIn("fast")
                          .html(html + " " + privlyTooltip.tooltipMessage);    
        },
        function(){
            jQuery("#tooltip").remove();
        });
      jQuery("body").mousemove(function(e){
        jQuery("#tooltip").css("top", (e.pageY - xOffset) + "px")
                          .css("left", (e.pageX + yOffset) + "px")
                          .html(html + " " + privlyTooltip.tooltipMessage);
      });
    },
    
    /**
     * Constructs the user's security glyph, which indicates whether the 
     * injected content is trusted. The Glyph is assumed to be defined by the
     * extension before this script is run. It can be reset via the options
     * interface.
     *
     * The glyph is currently defined by a string in 
     * localStorage["privly_glyph"], that is a series of hex colors stated
     * without the leading hash sign, and separated by commas.
     *
     * eg: ffffff,f0f0f0,3f3f3f
     *
     * Note: Since the Mozilla architecture does not support localStorage,
     * it uses the preferences API.
     *
     * @return {string} An HTML table of the glyph.
     *
     */
    glyphHTML: function() {
      
      //Add the CSS for the glyph
      var glyphCells, glyphColor;
      if ( privlyNetworkService.platformName() === "FIREFOX" ) {
        var firefoxPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefService)
                              .getBranch("extensions.privly.");
        try {
          glyphString = firefoxPrefs.getCharPref("glyph_cells");
          glyphColor = firefoxPrefs.getCharPref("glyph_color");
        } catch(err) {
          privlyTooltip.generateNewGlyph();
          glyphString = firefoxPrefs.getCharPref("glyph_cells");
          glyphColor = firefoxPrefs.getCharPref("glyph_color");
        }
      }else{

        if (localStorage.getItem("glyph_cells") === null) {
          glyphString = privlyTooltip.generateNewGlyph();
          glyphColor = Math.floor(Math.random()*16777215).toString(16);
        } else {
          glyphString = localStorage["glyph_cells"];
          glyphColor = localStorage["glyph_color"]; 
        }
      }
      
      var glyphArray = glyphString.split(",");
            
      // Construct the 5x5 table that will represent the glyph.
      // Its 3rd column will be axis of symmetry
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
          td.innerHTML = "&nbsp";

          // Fill only the first three columns with the coresponding values from glyphArray[]
          // The rest of two columns are simetrical to the first two
          if(j <= 2) {
            if(glyphArray[i * 3 + j] == "true") {
              td.setAttribute("class", "glyph_fill");
            } else {
              td.setAttribute("class", "glyph_empty");
            }        
          } else {
            if(glyphArray[i * 3 + (5 % (j + 1))] == "true") {
              td.setAttribute("class", "glyph_fill");
            } else {
              td.setAttribute("class", "glyph_empty");
            }
          }

          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }

      table.appendChild(tbody);

      var rule = '.glyph_fill' + '{background-color:#' + glyphColor + ';' +'}';
      var rule2 = '.glyph_empty' + '{background-color:#ffffff;}';
      var rule3 = '.glyph_table' + '{border-collapse: collapse; line-height: 4px; float: left; margin-right: 5px;}';

      document.styleSheets[0].insertRule(rule,0);
      document.styleSheets[0].insertRule(rule2,0);
      document.styleSheets[0].insertRule(rule3,0);
      
      return table;
    }
};
