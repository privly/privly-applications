# Integration Testing

## Why

Privly runs on many operating systems, browsers, and scripting contexts. Such
complexity requires a testing framework that can perform "user activities"
like logging in, creating content, viewing injected content, etc, across
many different integrated systems. Selenium is that testing framework.

## Integration Testing Versus Unit Testing

This testing framework tests the applications at the coarsest scale: where the
user interacts by clicking and typing into the browser. Another
type of testing, unit testing, breaks up the applications into isolated components.
Applications require both types of testing for them to reach production.

For more information on unit tests, read about Karma in the testing directory.

## How are Privly's integration tests architected?

Privly uses several technologies in concert for integration tests.
Since these technologies are best supported in the Ruby programming language,
several Ruby libraries are used. Selenium Webdriver is a combination of
a connection library and scripting language for operating a web browser
programmatically. Since dealing with asynchronous actions and other
issues can be painful in plain Selenium Webdriver, we use
[Capybara](https://github.com/jnicklas/capybara) as a scripting language
on top of Webdriver. Capybara's interactions with the web browser have expected
results that should be the basis of tests. These tests are written with
Ruby's unit testing library. Each unit test case is in the "specs" folder.
Tests are each in their own file with "tc_" (test case) prepended and groups of
tests are collected into files with "ts_" (test suite) prepended.

To run your tests you can: (a) include them in an existing test case,
(b) copy an existing test case, modify it, and "require_relative"
it from an existing test suite, or (c) "require_relative" the file at the bottom
of the run_all.rb file.

## Prerequisites

To run these tests you need to download several software packages.

* Ruby 1.9.3 or higher. This has been tested on 1.9.3.
* The browser your are testing against (Chrome and Firefox are currently available).
* If you are testing against Chrome, you need to install Chromedriver as well.
You can install Chrome Driver with `brew install chromedriver` (if you have Brew),
otherwise [see the docs](https://code.google.com/p/selenium/wiki/ChromeDriver) and
update this guide :).
* A running [content server](https://github.com/privly/privly-web). This is necessary
even if you are note testing the content server because the extension tests will
expect to have a place it can store content.
* If you want to run the tests against [SauceLabs](http://saucelabs.com) you will also
need to install [SauceConnect](https://docs.saucelabs.com/reference/sauce-connect/).
SauceLabs provides many different browsers and operating systems to test against.

Typically Ruby installs will not include the following libraries
required for the testing framework:

* selenium-webdriver  
* capybara  

You should install them with `gem install LIBRARY`.

If you are using SauceLabs, you will also need to install the Sauce gem:

* sauce

## Running Integration Tests Locally

If you want to run the tests on SauceLabs, then we recommend you setup the tests locally
first so you know what to expect. Running on a set of virtualized browsers is not
complicated but it is easy to get wrong.

Assuming you have setup the proper systems as above, you can run several different
browsers and scripting contexts. First **ensure you are testing the applications
from a context that can be tested...**

Again, !ensure you are testing the applications from a context that can be tested!.
This means that if you are going to test the applications in the Firefox Extension
context, that you are running the tests from the privly-applications folder of the
Firefox extension. If this is not the case, then the applications will not be built
properly.

Valid testing contexts include:

**firefox_web:** run Firefox locally without an extension. So long as you have
a webserver running locally, this should succeed.

**chrome_web:** run Chrome locally without an extension. So long as you have
a webserver running locally, this should succeed.

**firefox_extension:** run Firefox locally with an extension. You should only run
this from the privly-applications directory of the privly-firefox extension.

**chrome_extension:** run Chrome locally with an extension. You should only run
this from the privly-applications directory of the privly-chrome extension.

You can run each of these from the privly-applications directory with
`ruby run_all.rb -p INSERT_PLATFORM_HERE`. The corresponding browser will be
opened and the specs included by `run_all.rb` will be run.

## Running Integration Tests on Sauce Labs

Since no individual dev has all 20+ supported scripting contexts, it is often
necessary to test against the hundreds of virtualized browsers found on SauceLabs.

Each test requires **SauceConnect to be running**, as well as **a local webserver.**

To launch on Sauce, you need to replace the `@sauce_url` variable in run_all.rb
with the URL for your SauceLabs account. You can find that URL if you are logged
in to SauceLab's website by visiting [this web page](https://saucelabs.com/docs/ondemand/getting-started/env/ruby/se2/mac).

### sauce_firefox_web

This will launch the current Beta version of Firefox on Windows. It will navigate the
webserver you have running on localhost so make sure that is where the application files are that you want to test.

From the privly-applications directory, run: `ruby run_all.rb -p sauce_firefox_web -c http://localhost:3000`

### sauce_firefox_extension

This will launch the current Beta version of Firefox on Windows. It will navigate the
extension from which you launched the tests, but the applications expect localhost:3000 to present a content server for storage.

From the privly-applications directory, run: `ruby run_all.rb -p sauce_firefox_extension -c http://localhost:3000`

### sauce_chrome_web

This will launch the current Beta version of Chrome on Windows. It will navigate the
webserver you have running on localhost so make sure that is where the application files are that you want to test.

From the privly-applications directory, run: `ruby run_all.rb -p sauce_chrome_web -c http://localhost:3000`

### sauce_chrome_extension

This will launch the current Beta version of Chrome on Windows. It will navigate the
extension from which you launched the tests, but the applications expect localhost:3000 to present a content server for storage.

From the privly-applications directory, run: `ruby run_all.rb -p sauce_chrome_extension -c http://localhost:3000`

## TravisCI

The best part of SauceLabs is that the tests can run on every commit you push
to GitHub without you needing to run them locally. To configure this you will need
to use TravisCI's secure environment variable to assign the environment variable
`SAUCE_URL` to the URL. For example:

    export SAUCE_URL=http://privly:afafafaf-afaf-afaf-afaf-afafafafafa0@ondemand.saucelabs.com:80/wd/hub
