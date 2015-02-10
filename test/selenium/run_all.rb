#
# See README.md for details.
#
# Run all the specs that are defined in the all_specs.rb
# file. This script defaults to testing the applications on
# Firefox without the extension (web). You can specify
# an extension platform by passing in the associated
# browser name. You can also set the content server
# if you are not testing the web platform by passing
# a domain.
# Finally, you can limit the tests to particular release statuses
# by passing another option.
#
require 'optparse' # Options parsing
require 'selenium-webdriver' # Connecting to the browsers
require 'json' # Crawling the manifest files to decide what to test
require 'capybara' # Manages Selenium
require 'capybara/dsl' # Syntax for interacting with Selenium
require 'test/unit' # Provides syntax for expectation statements

# Change the directory to this script's directory
Dir.chdir File.expand_path(File.dirname(__FILE__))

args = {}
optsHelp = ""
OptionParser.new do |opts|
  opts.banner = "Usage: ruby run_all.rb [options]"
  opts.on('-p', '--platform PLATFORM', 'The target platform (firefox_web, firefox_extension, chrome_web, chrome_extension, sauce_chrome_web, sauce_firefox_web, sauce_firefox_extension, sauce_chrome_extension)') { |v| args[:platform] = v }
  opts.on('-r', '--release-status RELEASE', 'The target release stage (experimental, deprecated, alpha, beta, release)') { |v| args[:release_status] = v }
  opts.on('-c', '--content-server SERVER', 'The content server (http://localhost:3000)') { |v| args[:content_server] = v }
  optsHelp = opts.help
end.parse!

# Exit if three arguments were not supplied
if not args.length == 3
  puts "\nYou must specify all three arguments\n\n"
  puts optsHelp
  exit 0
end

puts "You passed the arguments: #{args}"

# Defaults
platform = "firefox_web" # Assume testing the web version unless otherwise noted
@@privly_extension_active = false # The apps are not in an extension env
@@privly_applications_folder_path = "http://localhost:3000/apps/"
release_status = "deprecated" # Include deprecated apps by default
Capybara.run_server = false
Capybara.app_host = 'http://localhost:3000'
content_server = "http://localhost:3000"
Capybara.default_wait_time = 15

# This global data structure provides a test set that each of the
# specs can use to guarantee behavior across apps. The components
# give the URL of the application to be opened in the browser,
# the content_server that the application is expected to be associated
# with (default is the same as the domain of the URL), and the dictionary
# that is passed to the template files.
@@privly_test_set = [
  # url,
  # content_server,
  # manifest_dictionary
]

# Intialize for the platform we are testing
#
# Valid options include:
#  sauce_firefox_web: run Firefox on saucelabs without an extension.
#                     This requires a webserver to run on localhost:3000
#  sauce_firefox_extension: run Firefox on saucelabs with an extension.
#  firefox_web: run Firefox locally without an extension.
#               This requires a webserver to run on localhost:3000
#  firefox_extension: run Firefox locally with an extension.
#  sauce_chrome_web: run Chrome on saucelabs without an extension.
#                     This requires a webserver to run on localhost:3000
#  sauce_chrome_extension: run Chrome on saucelabs with an extension.
#  chrome_web: run Chrome locally without an extension.
#               This requires a webserver to run on localhost:3000
#  chrome_extension: run Chrome locally with an extension.
if args[:platform]
  platform = args[:platform]
end

@@privly_extension_active = platform.include?("extension")

# Setup the functionality common to all Sauce testing
# Requires Sauce Connect
# https://docs.saucelabs.com/reference/sauce-connect/
if platform.start_with? "sauce"
  require 'sauce'
  require 'sauce/capybara'
  @browser = platform.split("_")[1]
  Sauce.config do |config|
    config['name'] = "Feature Specs"
    config['browserName'] = @browser
    if @browser == "firefox"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.firefox
      config['version'] = "34"
      @sauce_caps.version = "34"
    elsif @browser == "chrome"
      @sauce_caps = Selenium::WebDriver::Remote::Capabilities.chrome
      config['version'] = "39"
      @sauce_caps.version = "39"
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
else
  @browser = platform.split("_")[0]
end

if platform == "sauce_firefox_web" or platform == "sauce_chrome_web"
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

if platform == "firefox_web" or platform == "chrome_web"
  Capybara.register_driver :web_browser do |app|
   Capybara::Selenium::Driver.new(app, :browser => @browser.to_sym)
  end
  @@privly_applications_folder_path = "http://localhost:3000/apps/"
  content_server = "http://localhost:3000"
  Capybara.default_driver = :web_browser
  Capybara.current_driver = :web_browser
end

# Package and add the Firefox extension as necessary
if platform.include? "firefox_extension"

  # Assign the path to find the applications in the extension
   Capybara.app_host = "chrome://privly"
   @@privly_applications_folder_path = Capybara.app_host + "/content/privly-applications/"
   puts "Packaging the Firefox Extension"
   system( "cd ../../../../../ && pwd && ./package.sh && cd chrome/content/privly-applications/test/selenium" )

   # Load the Firefox driver with the extension installed
   @profile = Selenium::WebDriver::Firefox::Profile.new
   @profile.add_extension("../../../../../PrivlyFirefoxExtension.xpi")
end

if platform == "firefox_extension"
  Capybara.register_driver :firefox_extension do |app|
    Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => @profile)
  end
  Capybara.current_driver = :firefox_extension
  Capybara.default_driver = :firefox_extension

  # Assign the content server to the remote server
  content_server = "https://dev.privly.org"
end

if platform == "sauce_firefox_extension"
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

# requires ChromeDriver
# Mac: brew install chromedriver
if platform == "chrome_extension"

  # Assign the path to find the applications in the extension
  Capybara.app_host = "chrome-extension://gipdbddcenpbjpmjblgmogkeblhoaejd"
  @@privly_applications_folder_path = Capybara.app_host + "/privly-applications/"

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

  # Assign the content server to the remote server
  content_server = "https://dev.privly.org"
end

if platform == "sauce_chrome_extension"

  # Package the extension
  system("../../../package/travis.sh")

  # extensions cannot be read as text
  # Base64.strict_encode64 File.read(crx_path)
  extension = Base64.strict_encode64 File.binread("../../../PrivlyChromeExtension.crx")

  @sauce_caps["chromeOptions"] = {
    "args" => [ "--disable-web-security" ],
    "extensions" => [extension]
  }

  # Assign the path to find the applications in the extension
  Capybara.app_host = "chrome-extension://gbgechigghkleokfnpebmlfldpbloelf"
  @@privly_applications_folder_path = Capybara.app_host + "/privly-applications/"

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

# Platforms that are not currently implemented
if platform == "safari" or platform == "ie"
  puts "This platform is not integrated into testing"
  exit 0
end

if args[:content_server]
  content_server = args[:content_server]
end

if args[:release_status]
  release_status = args[:release_status]
end

# Build the data structure used by some specs to determine what to test
manifest_files = Dir["../../*/manifest.json"]
manifest_files.each do |manifest_file|
  json = JSON.load(File.new(manifest_file))
  json.each do |app_manifest|

    outfile_path = app_manifest["outfile_path"]
    if app_manifest["platforms"] and
      not app_manifest["platforms"].include?(@browser)
      puts "Skipping due to target platform: " + outfile_path
      next
    end

    release_titles = ["redirect", "experimental", "deprecated", "alpha", "beta", "release"]
    unless release_titles.index(app_manifest["release_status"]) >= 
      release_titles.index(release_status)
      puts "Skipping due to release status: " + outfile_path
      next
    end

    # Pages to be tested
    page_url = @@privly_applications_folder_path+outfile_path
    
    @@privly_test_set.push({
        :url => page_url, 
        :content_server => content_server, 
        :manifest_dictionary => app_manifest["subtemplate_dict"]
    })
    
  end
end

require_relative "specs/ts_all_specs"
