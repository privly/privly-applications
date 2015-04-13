# This file contains all the boilerplate code to enable integration with many
# different browser and scripting contexts.

require 'selenium-webdriver' # Connecting to the browsers
require 'capybara' # Manages Selenium
require 'capybara/dsl' # Syntax for interacting with Selenium
require 'test/unit' # Provides syntax for expectation statements

# Sets the amount of time tests will wait for
# asynchronous events to happen. Increasing this
# parameter is a good way to debug why your tests
# may be failing
Capybara.default_wait_time = 15

Capybara.run_server = false

# This is the common config for running tests from the
# web scripting environment
def common_configuration_for_web
  Capybara.register_driver :web_browser do |app|
   Capybara::Selenium::Driver.new(app, :browser => @browser.to_sym)
  end
  @@privly_applications_folder_path = "http://localhost:3000/apps/"
  content_server = "http://localhost:3000"
  Capybara.default_driver = :web_browser
  Capybara.current_driver = :web_browser
end

# This is the common config for running tests from the
# Firefox scripting environment
def common_configuration_for_firefox_extension
  # Assign the path to find the applications in the extension
  Capybara.app_host = "chrome://privly"
  @@privly_applications_folder_path = Capybara.app_host + "/content/privly-applications/"
  puts "Packaging the Firefox Extension"
  system( "cd ../../../../../ && pwd && ./package.sh && cd chrome/content/privly-applications/test/selenium" )

  # Load the Firefox driver with the extension installed
  @profile = Selenium::WebDriver::Firefox::Profile.new
  @profile.add_extension("../../../../../PrivlyFirefoxExtension.xpi")
end

# This is the common config for running tests from the
# Chrome scripting environment
def common_configuration_for_chrome_extension
  # Assign the path to find the applications in the extension
  Capybara.app_host = "chrome-extension://gipdbddcenpbjpmjblgmogkeblhoaejd"
  @@privly_applications_folder_path = Capybara.app_host + "/privly-applications/"
end

# This is the common config for running tests from the
# web scripting environment on SauceLabs
def common_configuration_for_sauce_web
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
  Sauce.config do |config|
    config['name'] = "Feature Specs"
    config['browserName'] = @browser

    # https://docs.saucelabs.com/reference/platforms-configurator
    if @browser == "firefox"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.firefox
      config['version'] = "dev"
      @sauce_caps.version = "dev"
    elsif @browser == "chrome"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.chrome
      config['version'] = "dev"
      @sauce_caps.version = "dev"
    end

    @sauce_caps.platform = "Windows 7"
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

def configure_for_firefox_web
  common_configuration_for_web
end

def configure_for_chrome_web
  common_configuration_for_web
end

def configure_for_sauce_firefox_web
  common_configuration_for_sauce
  common_configuration_for_sauce_web
end

def configure_for_sauce_chrome_web
  common_configuration_for_sauce
  common_configuration_for_sauce_web
end

def configure_for_sauce_firefox_extension
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

def configure_for_sauce_chrome_extension

  common_configuration_for_sauce
  common_configure_for_chrome_extension

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
end

def configure_for_firefox_extension
  common_configuration_for_firefox_extension
  Capybara.register_driver :firefox_extension do |app|
    Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => @profile)
  end
  Capybara.current_driver = :firefox_extension
  Capybara.default_driver = :firefox_extension
end

def configure_for_chrome_extension
  common_configuration_for_chrome_extension
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
end
