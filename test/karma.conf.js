// Karma configuration
// Generated on Thu Mar 13 2014 14:12:04 GMT-0700 (PDT)
module.exports = function(config) {

  // If the script is not being executed from the testing directory
  if(process.cwd() !== __dirname) {
    console.warn(
      "\n!!!\nYou are running this script from outside the test directory. " +
      "If you do not have the required node modules on your NODE_PATH, " +
      "you will not be able to run these tests.\n!!!\n");
    console.warn(
      "You may need to issue something like: " +
      "`export NODE_PATH=/PATH/TO/privly-applications/test/node_modules");
  }

  // Force the script to execute from its directory
  process.chdir(__dirname);

  // All files will be referenced relative to the privly-applications folder
  var basePath = "..";

  // List the files that you want to always test here.
  // The .travis.yml file can also pass in other files
  // by exporting an environment variable containing a list of
  // Javascript file paths.
  var filesToTest = [];

  var filesToExcludeFromTest = [];
  if (process.env.FILES_TO_TEST) {
    filesToTest = filesToTest.concat(process.env.FILES_TO_TEST.split(","));
  }
  if (process.env.FILES_TO_EXCLUDE_FROM_TEST) {
    filesToExcludeFromTest = filesToExcludeFromTest.concat(process.env.FILES_TO_EXCLUDE_FROM_TEST.split(","));
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: basePath,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: filesToTest,

    // files to exclude from testing
    exclude: filesToExcludeFromTest,

    // test result reporters to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [
      'progress'
    ],

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
