/**
 * @fileOverview This script provides functions for processing image files.
 * The images will be placed into the DOM as a data URL. The data URL can
 * then be processed by the crypto of the application and sent off to a
 * remote server.
 */

/**
 * Show the user that the app will accept dropped content.
 * @param {event} evt The drag over event.
 */
function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy
}

/**
 * Process files before it is uploaded to the remote server. The first file
 * with the proper extension will be processed.
 *
 * @param {event} evt The event from the file upload interaction.
 * @param {function} callback The function to call after the files are processed. 
 */
function handleFileSelect(evt, callback) {
  
  // Prevent opening a new window
  evt.stopPropagation();
  evt.preventDefault();
  
  var files;
  if( evt.target.id === "drop_zone" ) {
     files = evt.dataTransfer.files;
  } else {
    files = evt.target.files;
  }

  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0, f; f = files[i]; i++) {

    // Only process image files.
    if (!f.type.match('image.*')) {
      continue;
    }
    
    // Only process smaller files. This application can handle larger files,
    // but it will be slow to encrypt/decrypt.
    if (f.size > 2000000) {
      $("#messages").text(
        "Files should be smaller than 1 MB").show();
      continue;
    }
    
    var reader = new FileReader();

    // Closure to capture the file information. Creates an image DOM
    // element and replaces prior images.
    reader.onload = (function(theFile) {
      return function(e) {
        var img = document.createElement('img');
        img.setAttribute("id", "clearimage");
        img.setAttribute("src", e.target.result);
        img.setAttribute("title", "decrypted image");
        img.setAttribute("class","img-responsive");
        img.setAttribute("style","WIDTH: 100%; HEIGHT: 100%");
        $("#clearimage").replaceWith(img);
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
  
  if ( callbacks.functionExists(callback) ) {
    callback();
  }
}