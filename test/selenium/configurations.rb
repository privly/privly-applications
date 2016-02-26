# This file contains all the boilerplate code to enable integration with many
# different browser and scripting contexts.

require 'selenium-webdriver' # Connecting to the browsers
require 'capybara' # Manages Selenium
require 'capybara/dsl' # Syntax for interacting with Selenium
require 'minitest/autorun' # Provides syntax for expectation statements

# Sets the amount of time tests will wait for
# asynchronous events to happen. Increasing this
# parameter is a good way to debug why your tests
# may be failing
Capybara.default_wait_time = 15

Capybara.run_server = false

# This is the common config for running tests from the
# web scripting environment
def common_configuration_for_web(args)

  # Assign the privly-applications repository path
  content_server = args[:content_server]
  $privly_applications_folder_path = content_server + "/apps/"

  Capybara.register_driver :web_browser do |app|
   Capybara::Selenium::Driver.new(app, :browser => @browser.to_sym)
  end
  Capybara.default_driver = :web_browser
  Capybara.current_driver = :web_browser
end

# This is the common config for running tests from the
# Firefox scripting environment
def common_configuration_for_firefox_extension
  # Assign the path to find the applications in the extension
  Capybara.app_host = "chrome://privly"
  $privly_applications_folder_path = Capybara.app_host + "/content/privly-applications/"
  puts "Packaging the Firefox Extension"
  system("cd ../../../../../ && pwd && jpm xpi && cd chrome/content/privly-applications/test/selenium")
  # Find out the xpi file name
  json = JSON.load(File.new("../../../../../package.json"))
  xpi_filename = "privly@priv.ly-" + json['version'] + ".xpi"
  # Load the Firefox driver with the extension installed
  @profile = Selenium::WebDriver::Firefox::Profile.new
  @profile["extensions.privly.integration_test"] = "true"
  @profile.add_extension("../../../../../" + xpi_filename)
end

# This is the common config for running tests from the
# Chrome scripting environment
def assign_chrome_extension_path

  # The chrome URL can change periodically so this grabs the
  # URL from the first run page. It also fixes the path in the
  # CRUD tests since this test doesn't run until all the
  # initialization is complete
  include Capybara::DSL # Provides for Webdriving

  # Give the first-run page 15 seconds to appear
  for i in 0..15
    newest_window = page.driver.browser.window_handles.last
    page.driver.switch_to_window newest_window
    address = page.driver.browser.current_url
    if address.include? "chrome-extension://"
      break
    end
    if i == 15
      puts "failed to recover Chrome extension URL for testing"
      exit 1
    end
    sleep 1
  end
  app_host = "chrome-extension://" + address.split("/")[2]
  Capybara.app_host = app_host
  $privly_applications_folder_path = Capybara.app_host + "/privly-applications/"
  Capybara.reset_sessions!
  Capybara.use_default_driver
end

# This is the common config for running tests from the
# web scripting environment on SauceLabs
def common_configuration_for_sauce_web(args)

  # Assign the applications path
  content_server = args[:content_server]
  $privly_applications_folder_path = content_server + "/apps/"

  Capybara.register_driver :sauce_web do |app|
   Capybara::Selenium::Driver.new(
     app,
     :browser => :remote,
     :url => @sauce_url,
     :desired_capabilities => @sauce_caps
    )
  end
  Capybara.default_driver = :sauce_web
  Capybara.current_driver = :sauce_web
end

# This is the common config for running tests on SauceLabs.
# Requires Sauce Connect
# https://docs.saucelabs.com/reference/sauce-connect/
def common_configuration_for_sauce
  require 'sauce'
  require 'sauce/capybara'
  $sauce_os = "Windows 7"
  Sauce.config do |config|
    config['name'] = "Feature Specs"
    config['browserName'] = @browser

    # https://docs.saucelabs.com/reference/platforms-configurator
    if @browser == "firefox"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.firefox
      config['version'] = "38.0"
      @sauce_caps.version = "38.0"
      platform = $sauce_os
    elsif @browser == "chrome"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.chrome
      config['version'] = "beta"
      @sauce_caps.version = "beta"
      platform = $sauce_os
    elsif @browser == "safari"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.safari
      config['version'] = "8.0"
      @sauce_caps.version = "8.0"
      $sauce_os = "OS X 10.10"
      platform = $sauce_os
    end

    @sauce_caps.platform = platform
    @sauce_caps[:name] = "Priv.ly Project Integration Tests"

    if ENV['SAUCE_URL'] == nil or ENV['SAUCE_URL'] == ""
      puts "Before you can test on Sauce you need to set an environmental variable containing your Sauce URL"
      exit 1
    end

    # You can also hard code the URL here, but remember it contains your credentials...
    @sauce_url = ENV['SAUCE_URL']

    # Support TravisCI if that is where this is running
    if ENV['TRAVIS_JOB_NUMBER']
      @sauce_caps["tunnel-identifier"] = ENV['TRAVIS_JOB_NUMBER']
    end

    # Give the webserver time to boot when running on TravisCI
    if ENV['TRAVIS_LAUNCHES_SAUCE_CONNECT']
      puts "sleeping for 5 seconds"
      sleep 5
    end
  end
end

def configure_for_firefox_web(args)
  common_configuration_for_web(args)
end

def configure_for_chrome_web(args)
  common_configuration_for_web(args)
end

def configure_for_safari_web(args)
  common_configuration_for_web(args)
  # Do not block pop-up windows in Safari
  # https://macmule.com/2012/07/31/disabling-safari-5-1-xs-6-xs-pop-up-blocker-from-terminal-2/
  `defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2JavaScriptCanOpenWindowsAutomatically -bool true`
end

def configure_for_sauce_firefox_web(args)
  common_configuration_for_sauce
  common_configuration_for_sauce_web(args)
end

def configure_for_sauce_chrome_web(args)
  common_configuration_for_sauce
  common_configuration_for_sauce_web(args)
end

def configure_for_sauce_safari_web(args)
  common_configuration_for_sauce
  common_configuration_for_sauce_web(args)
end

def configure_for_sauce_firefox_extension(args)
  common_configuration_for_sauce
  common_configuration_for_firefox_extension
  @sauce_caps.firefox_profile = @profile
  Capybara.register_driver :sauce_firefox_extension do |app|
    Capybara::Selenium::Driver.new(
      app,
      :browser => :remote,
      :url => @sauce_url,
      :desired_capabilities => @sauce_caps
    )
  end
  Capybara.current_driver = :sauce_firefox_extension
  Capybara.default_driver = :sauce_firefox_extension
end

def configure_for_sauce_chrome_extension(args)

  common_configuration_for_sauce

  # Package the extension
  system("../../../package/travis.sh")

  # extensions cannot be read as text
  # Base64.strict_encode64 File.read(crx_path)
  extension = Base64.strict_encode64 File.binread("../../../PrivlyChromeExtension.crx")

  @sauce_caps["chromeOptions"] = {
    "args" => [ "--disable-web-security" ],
    "extensions" => [extension]
  }

  Capybara.register_driver :sauce_chrome_extension do |app|
    Capybara::Selenium::Driver.new(
      app,
      :browser => :remote,
      :url => @sauce_url,
      :desired_capabilities => @sauce_caps
    )
  end
  Capybara.current_driver = :sauce_chrome_extension
  Capybara.default_driver = :sauce_chrome_extension

  assign_chrome_extension_path

end

def configure_for_firefox_extension(args)
  common_configuration_for_firefox_extension
  Capybara.register_driver :firefox_extension do |app|
    Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => @profile)
  end
  Capybara.current_driver = :firefox_extension
  Capybara.default_driver = :firefox_extension
end

def configure_for_chrome_extension(args)
  # This currently references the relative path to the URL
  caps = Selenium::WebDriver::Remote::Capabilities.chrome(
    "chromeOptions" => {
      "args" => [ "--disable-web-security", "load-extension=../../.." ]
      }
  )

  Capybara.register_driver :chrome_extension do |app|
    Capybara::Selenium::Driver.new(app, :browser => :chrome,
      :desired_capabilities => caps)
  end
  Capybara.current_driver = :chrome_extension
  Capybara.default_driver = :chrome_extension

  assign_chrome_extension_path

end
