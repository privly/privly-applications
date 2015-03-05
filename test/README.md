This directory gives the configuration for the Karma test runner.
Karma runs the Jasmine tests defined in the privly-applications
module on browsers you have defined locally or on Sauce labs.

## Setup ##

Prerequisites:  
You need to have [node](http://nodejs.org/) installed.

Once you have node installed, you should install the Karma
command line interface from the directory where this README
is located:

> npm install -g karma-cli && npm install

This will install the necessary node modules to the current
directory.

### Selecting Which Tests to Run ###

The Karma configuration has a default test set, but it is
possible to add your own tests by defining a CSV of test
files as an environment variable. For example, if you want to
test a file in the Fu application named bar.js, you would
type this before running your tests:

> export FILES_TO_TEST="Fu/js/bar.js,Fu/test/bar.js"

This will tell the Karma config to load the bar.js file
into the testing iframe and then run the tests defined
by the bar.js testing script.

## Running ##

In each browser Karma creates
a set of iframes that run your tests in parallel.

There are two ways to run your tests. If you run the tests locally,
your local browsers will be opened. This allows you
to edit your local source files, which will be run against their
tests every time the file is saved.

### Running Locally ###

To run karma locally you should add anything you want to test
as an environmental variable (see above) then issue the command
found below from this directory.

> karma start

Two browsers should open and run your tests every time you save them.

### Running on Sauce Labs ###

[SauceLabs](https://saucelabs.com/) is a browser virtualization service that
allows for simultaneous tests across a variety of platforms and browsers.
When tests run on Sauce they are usually run from the TravisCI server, but
you can also hook your local dev environment into SauceLabs by
first associating your machine with Sauce Labs (see below), then
issuing:

> karma start karma.conf-ci.js

For more details on how this was setup, see:
https://docs.saucelabs.com/tutorials/js-unit-testing/

If you want your tests to run on the Continuous Integration server, you should
appropriately edit the .travis.yml file to include your test set.

# Writing Your Own Unit Tests

Privly has several test types serving different purposes. This directory
is aimed at unit testing, which means you should strive to
isolate individual functions and test their functionality and
assumptions.

Other test types include:

* Integration tests: makes sure Privly
injects properly
* Content server tests: makes sure the content server functions properly
* Application tests: makes sure the whole applications are functioning properly

For more information, you can read about the complete overview of
[Privly testing](https://github.com/privly/privly-organization/wiki/Testing).

## Hello World ##

Assuming you have gotten Karma running as directed earlier in this README,
you can now write your first test. Open the test file for the shared script
that handles grabbing parameters from the URL, `shared/test/parameters.js`,
and start Karma with:

> karma start

If you get a message about tests passing and failing you are ready to
add your first test.

Edit the parameters test file you opened earlier. First add the following
inside the `describe` block.

    it("Doesn't fail", function() {
      expect(true).toBe(true);
    });

Then save the file. Now you should see the tests re-run, with one more passing test.
If that worked, you should try to purposefully make a test fail.

Try adding:

    it("Fails", function() {
      expect(true).toBe(false);
    });

If that worked, it is time to learn the Jasmine syntax these tests are written in.

## Jasmine Crash Course ## 

You should read through the [Jasmine docs](http://jasmine.github.io/2.0/introduction.html) to learn how to write Jasmine tests. It is a quick read and it will be *very* useful for writing good tests.

## Headless Browsers and Fixtures ##

Generally Jasmine assumes you are running the tests inside a Headless browser (Scripts without HTML), which means you cannot assume your Javascript will run in the context of
its HTML. Good tests will write "fixtures" so they don't have to run in the context of
HTML, but the legacy of Privly tests currently assumes the presence of the DOM.
This is why most of the current tests load their applications using the HTML2JS
plugin for Karma. New tests should not use the HTML2JS module to create fixtures,
but you should instead write your code so it either doesn't require page DOM or
the tests create the minimal DOM they require before testing their scripts.
