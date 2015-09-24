var fs = require('fs');
var uuid = require('uuid');

module.exports = function(config) {

  // These are the default coverageFiles. They should be updated when run from
  // the privly-safari repo, https://github.com/privly/privly-safari
  var coverageFiles = {
    '*/j*/!(raw*).js': 'coverage'
  };

  // If the script is not being executed from the testing directory
  if(process.cwd() !== __dirname) {

    if(process.cwd().indexOf("privly-safari") != -1) {
      // When the script is run from the privly-safari repo, update the coverageFiles
      coverageFiles = {
        '../scripts/**/*.js': 'coverage'
      };
    }

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

  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_USERNAME = require('./sauce').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
    }
  }

  // Check the environment variables for a binding
  // on TRAVIS_LAUNCHES_SAUCE_CONNECT, which indicates Travis
  // launches Sauce Connect instead of this script
  var thisFileLaunchesSauceConnect = true;
  if (process.env.TRAVIS_LAUNCHES_SAUCE_CONNECT) {
    thisFileLaunchesSauceConnect = false;
  }

  // List the files that you want to always test here.
  // The .travis.yml file can also pass in other files
  // by exporting an environment variable containing a list of
  // Javascripts.
  var filesToTest = [];

  var filesToExcludeFromTest = [];
  if (process.env.FILES_TO_TEST) {
    filesToTest = filesToTest.concat(process.env.FILES_TO_TEST.split(","));
  }
  if (process.env.FILES_TO_EXCLUDE_FROM_TEST) {
    filesToExcludeFromTest = filesToExcludeFromTest.concat(process.env.FILES_TO_EXCLUDE_FROM_TEST.split(","));
  }

  // Define the different types of browsers
  var sl_chrome = {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
    version: 'dev'
  }
  var sl_firefox = {
    base: 'SauceLabs',
    browserName: 'firefox',
    platform: 'Windows 7',
    version: '39.0'
  }
  var sl_safari = {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'OS X 10.8',
    version: '6.0'
  }

  // Browsers to run on Sauce Labs based on command line argument
  var customLaunchers = {};
  process.argv.forEach(function (value, index, array) {
    if (value.indexOf('--sauce-browsers=') == 0) {
      var sauceBrowsers = value.split('=')[1];
      sauceBrowsers = sauceBrowsers.split(',');
      sauceBrowsers.forEach(function (browser) {
        if (browser == 'Chrome') {
          customLaunchers['sl_chrome'] = sl_chrome;
        }
        else if (browser == 'Firefox') {
          customLaunchers['sl_firefox'] = sl_firefox;
        }
        else if (browser == 'Safari') {
          customLaunchers['sl_safari'] = sl_safari;
        }
        else {
          console.error("You specified an unsupported browser:", browser);
          console.log("Browser options are Firefox, Chrome, and Safari");
          console.log("Example:");
          console.log("`karma start karma.conf-ci.js --sauce-browsers=Firefox,Chrome,Safari`");
          process.exit(9);
        }
      });
    }
  });

  // If no command line argument has been passed for specific browsers, run
  // the tests on all the available browsers
  if (Object.keys(customLaunchers).length == 0) {
    customLaunchers['sl_chrome'] = sl_chrome;
    customLaunchers['sl_firefox'] = sl_firefox;
    customLaunchers['sl_safari'] = sl_safari;
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: basePath,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // Provide test coverage information for the matched
    // files. The compression library (both start with "raw")
    // is excluded.
    preprocessors: coverageFiles,

    // list of files / patterns to load in the browser
    files: filesToTest,

    // files to exclude from testing
    exclude: filesToExcludeFromTest,

    // test result reporters to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'coverage', 'saucelabs', 'coveralls'],

    coverageReporter: {
      type : 'lcovonly',
      dir : 'test/coverage/'
    },

    // Where to save the coverage information to
    coverageReporter: {
      type : 'lcovonly',
      dir : 'test/coverage/',
      subdir: '.',
      file : uuid.v1() + ".lcov"
    },

    // web server port
    port: 9876,

    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    sauceLabs: {
      startConnect: thisFileLaunchesSauceConnect,
      testName: 'Privly Jasmine Testing: Karma and Sauce Labs',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    captureTimeout: 120000,
    browserNoActivityTimeout: 20000,
    browserDisconnectTolerance: 2,
    browserDisconnectTimeout: 6000,
    customLaunchers: customLaunchers,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  });
};
