/**
 * @fileOverview This script is responsible for integration issues with a host
 * page. A host page is a website that this application is injected into (eg
 * webmail or a social network). 
 *
 * Injectable applications need to message the host page the height of the
 * iframe's contents. This script assumes you have defined a div on the page
 * with the ID "wrapper". The wrapper is used to determine the proper height 
 * of the iframe, and it should wrap all the visible content.
 *
 **/

/**
 * @namespace
 * Wrapper for behaviors required of injectable applications.
 */
var privlyHostPage = {
    
    /**
     * Send the parent document the height of this iframe's content. This will
     * allow the host page to resize the iframe to match its contents. 
     *
     * @param {integer} height The height of the content needing display.
     */
    dispatchResize: function(height) {
        //This event is fired with the required height of the iframe
        var evt = document.createEvent("Events");  
        evt.initEvent("IframeResizeEvent", true, false);
        var element = document.createElement("privElement");
        element.setAttribute("height", height);  
        var frameId = window.name;
        element.setAttribute("frame_id", frameId);  
        document.documentElement.appendChild(element);    
        element.dispatchEvent(evt);
        // Send the id and height to the parent window as JSON object with resize as the command.
        var resizeMsg = { 'command':'resize', 'frameID':frameId, 'heightNew':height};
        parent.postMessage(JSON.stringify(resizeMsg),"*");
        element.parentNode.removeChild(element);
    },


    /**
     * Helper function. Calls the right method according to the command so as to 
     * show/hide/remove the wrapper. 
     *
     */
    modifyWrapper: function(command){
        var evt = document.createEvent("Events");  
        evt.initEvent("IframeRemoveEvent", true, false);
        var element = document.createElement("privElement");
        var frameId = window.name;
        element.setAttribute("frame_id", frameId);  
        document.documentElement.appendChild(element);    
        element.dispatchEvent(evt);
        if(command === 'hide'){
            privlyHostPage.hideWrapper(frameId,element);
        }
        else if(command === 'show'){
            privlyHostPage.showWrapper(frameId,element);
        }
        else if(command === 'remove'){
            privlyHostPage.removeWrapper(frameId,element);
        }
    },

    /**
     * Send the parent document the name of this iframe. This will
     * allow the host page to hide the iframe and show the original link
     * instead. 
     *
     */
    hideWrapper: function(frameId, element){
        // Send the id of iframe to the parent window as JSON object with hide as the command.
        var hideMsg = {'command':'hide', 'frameID':frameId};
        parent.postMessage(JSON.stringify(hideMsg), "*");
        element.parentNode.removeChild(element);
    },

    /**
     * Send the parent document the name of this iframe. This will
     * allow the host page to show the iframe and hide the original link
     * instead. 
     *
     */
    showWrapper: function(frameId,element){
        // Send the id of iframe to the parent window as JSON object with show as the command.
        var showMsg = {'command':'show', 'frameID':frameId};
        parent.postMessage(JSON.stringify(showMsg), "*");
        element.parentNode.removeChild(element);
    },

    /**
     * Send the parent document the name of this iframe. This will
     * allow the host page to remove the iframe and show the original link
     * instead. 
     *
     */
    removeWrapper: function(frameId,element){
        // Send the id of iframe to the parent window as JSON object with remove as the command.
        var removeMsg = {'command':'remove', 'frameID':frameId};
        parent.postMessage(JSON.stringify(removeMsg), "*");
        element.parentNode.removeChild(element);
    },
    
    /**
     * Determine the proper height of this iframe, and then dispatch the
     * resize. This function expects a div with the id "wrapper," to be
     * wrapped around the visible content. The wrapper div is there to support
     * cross platform height discovery.
     */
    resizeToWrapper: function() {
        privlyHostPage.dispatchResize(15);
        jQuery("body").attr("height","100%");
        var newHeight = document.getElementById("privlyHeightWrapper").offsetHeight;
        newHeight += 18; // add 18px just to accommodate the tooltip
        privlyHostPage.dispatchResize(newHeight);
    },
    
    /**
     * Determines whether the application is injected into a page or not.
     * This function is primarily used to determine which stylesheets to
     * activate in the applications.
     *
     * @return boolean returns true of the application is being viewed inside
     * the context of another application, otherwise it returns false.
     *
     */
    isInjected: function() {
      if ( window.self === window.top ) { 
        return false;
      } else { 
        return true; 
      }
    }
};
