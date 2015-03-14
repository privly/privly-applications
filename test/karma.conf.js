// Karma configuration
// Generated on Thu Mar 13 2014 14:12:04 GMT-0700 (PDT)

module.exports = function(config) {

  // List the files that you want to always test here.
  // The .travis.yml file can also pass in other files
  // by exporting an environment variable containing a list of
  // Javascripts.
  var filesToTest = [

    // HTML files to use as a fixtures
    '*/*.html',

    // Force jquery to load first since it is a dependency
    'vendor/jquery.min.js',

    // Load all the vendor libraries
    'vendor/*.js',
    'vendor/datatables/jquery.dataTables.min.js',
    'vendor/datatables/dataTables.bootstrap.min.js',
    'vendor/bootstrap/js/*.js',

    // Load all the shared libraries at the top level
    'shared/javascripts/*.js',

    // Test the shared libraries
    'shared/test/*.js'];

  var filesToExcludeFromTest = [];
  if (process.env.FILES_TO_TEST) {
    filesToTest = filesToTest.concat(process.env.FILES_TO_TEST.split(","));
  }
  if (process.env.FILES_TO_EXCLUDE_FROM_TEST) {
    filesToExcludeFromTest = filesToExcludeFromTest.concat(process.env.FILES_TO_EXCLUDE_FROM_TEST.split(","));
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // Provide the HTML document as a fixture
    preprocessors: {
          '*/*.html': ['html2js'],

          // Load all the shared libraries at the top level
          'shared/javascripts/*.js': 'coverage'
        },

    // list of files / patterns to load in the browser
    files: filesToTest,

    // files to exclude from testing
    exclude: filesToExcludeFromTest,

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type : 'lcov',
      dir : 'test/coverage/',
      file : 'coverage.txt'
    },

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
    browsers: ['Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
