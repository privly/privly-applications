/** 
 * @fileOverview This file defines functions for loading testing specs,
 * Javascripts, and CSS files.  The files are specified using a custom meta tag
 *
 * `PrivlySpec` defines testings specs
 *
 * `PrivlyTopCSS` defines CSS files that should be loaded when the application
 * is viewed as the top application on the page.
 *
 * Note on testing: Currently this file assumes that the only way
 * to run the tests is when manually executed from the javascript console.
 *
 **/

/**
 * Loads a javascript file whose path is passed as an argument.
 * @param filename string path to the JS file that should be added to the 
 * HTML.
 */
function loadJs(filename){
  var fileref= document.createElement('script');
  fileref.setAttribute("type", "text/javascript");
  fileref.setAttribute("src", filename);
  if (typeof fileref !== "undefined"){
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

/**
 * Loads a CSS file whose path is passed as an argument.
 *
 * @param filename string path to the CSS file that should be added to the 
 * HTML.
 *
 */
function loadCSS(filename){
  var fileref= document.createElement('link');
  fileref.setAttribute("rel", "stylesheet");
  fileref.setAttribute("type", "text/css");
  fileref.setAttribute("href", filename);
  if (typeof fileref !== "undefined"){
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

/**
 * Returns the content of a meta tag whose name is passed as an argument.
 */
function getMetaValue(metaName){
  var metas = document.getElementsByTagName("meta");
  for (var i = 0; i < metas.length; i++){
    if(metas[i].getAttribute('name') == metaName){
      return metas[i].getAttribute('content');
    }
  }
  return "none";
}

/**
 * Loads test libraries, runs tests defined in spec file.
 */
function runTests(){
  var specToLoad = getMetaValue("PrivlySpec");
  if (specToLoad === "none"){
    return "Failed to load spec";
  }
  var testFiles= new Array();
  testFiles.push("../vendor/jasmine/jasmine-1.3.1/jasmine.js");
  testFiles.push("../vendor/jasmine/jasmine.console_reporter.js");
  specToLoad.split(",").forEach(function(el){testFiles.push(el);});
  testFiles.push("../shared/test/execute.js");
  
  // Ensures the testing scripts are loaded in the proper order
  function timedFunction(filename) {
    return function(){
      loadJs(filename);
    }
  }
  
  for (var i = 0; i < testFiles.length; i++){
    setTimeout(timedFunction(testFiles[i]), 100 * i);
  }
  return "Libraries and spec file loaded. Now running tests.";
}

/**
 * Loads all the files defined in the named meta tag and load them.
 * @param {string} meta The name of the meta tag.
 * @param {string} type The Type of the meta tag, "JS" or "CSS" are supported.
 * @return {boolean} A boolean value indicating whether
 * the any files were loaded.
 */
function loadFilesFromMeta(meta, type) {
  var filesToLoad = getMetaValue(meta);
  if (filesToLoad === "none"){
    return false;
  }
  var files = filesToLoad.split(";");

  for (var i = 0; i < files.length; i++){
    if( type === "CSS" ) {
      loadCSS(files[i]);
    } else if( type === "JS" ) {
      loadJs(files[i]);
    }
  }
  return true;
}

/**
 * Loads CSS files targeted for the top application.
 * @return {boolean} A boolean value indicating whether
 * any files were specified in meta tags.
 */
function loadTopCSS(){
  return loadFilesFromMeta("PrivlyTopCSS", "CSS");
}

/**
 * Loads JS files targeted for the top application.
 * @return {boolean} A boolean value indicating whether
 * any files were specified in meta tags.
 */
function loadTopJS(){
  return loadFilesFromMeta("PrivlyTopJS", "JS");
}

/**
 * Loads CSS files targeted for an injected application.
 * @return {boolean} A boolean value indicating whether
 * any files were specified in meta tags.
 */
function loadInjectedCSS(){
  return loadFilesFromMeta("PrivlyInjectedCSS", "CSS");
}

/**
 * Loads JS files targeted for the top application.
 * @return {boolean} A boolean value indicating whether
 * any files were specified in meta tags.
 */
function loadInjectedJS(){
  return loadFilesFromMeta("PrivlyInjectedJS", "JS");
}

// Uncomment to always run tests.
// setTimeout(function(){runTests();},1000)
