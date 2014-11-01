#
# Run all the specs that are defined in the all_specs.rb
# file. This script defaults to testing the applications on
# Firefox without the extension (web). You can specify
# an extension platform by passing in the associated
# browser name. You can also set the content server
# if you are not testing the web platform by passing
# a domain. If this parameter is not specified the
# dev.privly.org domain will be used.
# Finally, you can limit the tests to particular release statuses
# by passing another option.
#
require 'optparse' # Options parsing
require 'selenium-webdriver' # Connecting to the browsers
require 'JSON' # Crawling the manifest files to decide what to test
require 'capybara' # Manages Selenium
require 'capybara/dsl' # Syntax for interacting with Selenium
require 'test/unit' # Provides syntax for expectation statements

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

args = {}
OptionParser.new do |opts|
  opts.banner = "Usage: ruby example.rb [options]"
  opts.on('-p', '--platform PLATFORM', 'The target platform (web, firefox, chrome, etc)') { |v| args[:platform] = v }
  opts.on('-r', '--release-status RELEASE', 'The target release stage (experimental, deprecated, alpha, beta, release)') { |v| args[:release_status] = v }
  opts.on('-c', '--content-server SERVER', 'The content server (http://localhost:3000)') { |v| args[:content_server] = v }
end.parse!
puts "You passed the arguments: #{args}"


# Assume testing the web version unless otherwise noted
platform = "web"
address_start = "http://localhost:3000/apps/"

# Include deprecated apps by default
release_status = "deprecated"

# Register the vanilla drivers
@@privly_extension_active = false
Capybara.register_driver :firefox do |app|
 Capybara::Selenium::Driver.new(app, :browser => :firefox)
end
Capybara.register_driver :chrome do |app|
 Capybara::Selenium::Driver.new(app, :browser => :chrome)
end

Capybara.run_server = false
Capybara.default_driver = :firefox
Capybara.app_host = 'http://localhost:3000'
Capybara.default_wait_time = 10

content_server = "http://localhost:3000"

# Intialize for the platform we are testing
if args[:platform]

  platform = args[:platform]

  if platform == "web"
    address_start = "http://localhost:3000/apps/"
    content_server = "http://localhost:3000"
  end

  if platform == "chrome_web"
    address_start = "http://localhost:3000/apps/"
    content_server = "http://localhost:3000"
    Capybara.default_driver = :chrome
    Capybara.current_driver = :chrome
  end

  # The environment incorporating privly-applications provides serving the applications.
  # By convention, if the environment does not provide hosting for the data then the
  # dev.privly.org server is used. Since only content servers provide hosting
  # most scripting environments will use dev.privly.org.
  if platform == "firefox"

    # Assign the path to find the applications in the extension
    Capybara.app_host = "chrome://privly"
    address_start = Capybara.app_host + "/content/privly-applications/"

    puts "Packaging the Firefox Extension"
    system( "cd ../../../ && ./package.sh && cd chrome/content/privly-applications/" )

    # Load the Firefox driver with the extension installed
    profile = Selenium::WebDriver::Firefox::Profile.new
    profile.add_extension("../../../PrivlyFirefoxExtension.xpi")

    Capybara.register_driver :firefox_extension do |app|
      Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => profile)
    end
    Capybara.current_driver = :firefox_extension
    Capybara.default_driver = :firefox_extension

    # Assign the content server to the remote server
    content_server = "https://dev.privly.org"

    @@privly_extension_active = true

  end

  # requires ChromeDriver
  # Mac: brew install chromedriver
  if platform == "chrome"

    # Assign the path to find the applications in the extension
    Capybara.app_host = "chrome-extension://gipdbddcenpbjpmjblgmogkeblhoaejd"
    address_start = Capybara.app_host + "/privly-applications/"

    # Load the Firefox driver with the extension installed
    profile = Selenium::WebDriver::Chrome::Profile.new
    profile.add_extension("../PrivlyChromeExtension.zip")

    caps = Selenium::WebDriver::Remote::Capabilities.chrome(
      "chromeOptions" => {
        "args" => [ "--disable-web-security", "load-extension=.." ]
        }
    )

    Capybara.register_driver :chrome_extension do |app|
      Capybara::Selenium::Driver.new(app, :browser => :chrome, :desired_capabilities => caps)
    end
    Capybara.current_driver = :chrome_extension
    Capybara.default_driver = :chrome_extension

    # Assign the content server to the remote server
    content_server = "https://dev.privly.org"

    @@privly_extension_active = true

  end

  # Platforms that are not currently implemented
  if platform == "safari" or platform == "ie"
    address_start = "TODO"
    content_server = "https://dev.privly.org"
    puts "This platform is not integrated into testing"
    exit 0

    Capybara.register_driver :chrome_extension do |app|
      Capybara::Selenium::Driver.new(app, :browser => :chrome)
    end
  end
end

if args[:content_server]
  content_server = args[:content_server]
end

if args[:release_status]
  release_status = args[:release_status]
end

# Build the data structure used by some specs to determine what to test
manifest_files = Dir["*/manifest.json"]
manifest_files.each do |manifest_file|
  json = JSON.load(File.new(manifest_file))
  json.each do |app_manifest|

    outfile_path = app_manifest["outfile_path"]
    if app_manifest["platforms"] and
      not app_manifest["platforms"].include?(platform)
      puts "Skipping due to target platform: " + outfile_path
      next
    end

    release_titles = ["experimental", "deprecated", "alpha", "beta", "release"]
    unless release_titles.index(app_manifest["release_status"]) >= 
      release_titles.index(release_status)
      puts "Skipping due to release status: " + outfile_path
      next
    end

    # Pages to be tested
    page_url = address_start+outfile_path
    
    @@privly_test_set.push({
        :url => page_url, 
        :content_server => content_server, 
        :manifest_dictionary => app_manifest["subtemplate_dict"]
    })
    
  end
end

require_relative "specs/ts_all_specs"
