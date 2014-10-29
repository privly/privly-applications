#!/usr/bin/env rake

require 'selenium-webdriver' # Connecting to the browsers
require 'JSON' # Crawling the manifest files to decide what to test
require 'capybara' # Manages Selenium
require 'capybara/dsl' # Syntax for interacting with Selenium
# require 'capybara/rspec' # Provides syntax for expectation statements


# todos
# 1. Re-write the tests in Capybara's syntax
# 2. Re-write the tests in rspec or Cucumber's syntax
# 3. Run the tests on Sauce labs using this example:
#    https://saucelabs.com/docs/ondemand/getting-started/env/ruby/se2/mac


module ClickTesting
  class Test
    include Capybara::DSL
    def test_creation(driver)
      content = driver.find_element(:id, 'content')
      content.send_keys "Hello WebDriver!"
      driver.find_element(:id, 'save').click
      wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
      wait.until { driver.find_element(:class => "privlyUrl").displayed? }
    end

    def login(driver)
      login_button = driver.find_element(:class => "login_url")
      if login_button
        login_button.click
      end
      user = "development@priv.ly"
      password = "password"
      driver.find_element(:id, 'user_email').send_keys(user)
      driver.find_element(:id, 'user_password').send_keys(password)
      title = driver.title # wait for the redirect
      driver.find_element(:id, 'login').click
      wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
      wait.until { not driver.title == title }
    end

    def test_app(page_url, driver, content_server, subtemplate_dict)

      # This gives access to the vanilla webdriver: page.driver.browser

      # Load the HTML page with Webdriver
      puts "Testing: " + page_url
      visit page_url

      if subtemplate_dict["action"] == "new" and
        not subtemplate_dict["name"] == "Help" and
        not subtemplate_dict["name"] == "Login"

        if not page.driver.browser.find_element(:id, 'content').displayed?
          login(page.driver.browser)
        end

        wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
        wait.until { page.driver.browser.find_element(:id, 'content').displayed? }
        test_creation(page.driver.browser)
      end

    end
  end
end


# The environment incorporating privly-applications provides serving the applications.
# By convention, if the environment does not provide hosting for the data then the
# dev.privly.org server is used. Since only content servers provide hosting
# most scripting environments will use dev.privly.org.
#
# example `rake webdriver_firefox[web,alpha,http://localhost:3000]`
desc 'Run Webdriver Tests'
task :webdriver, [:platform, :release_status, :content_server] do |t, args|

  puts "You passed the positional arguments: #{args}"
  
  # Assume testing the web version unless otherwise noted
  platform = "web"
  address_start = "/apps/"
  
  # Register the vanilla drivers
  Capybara.register_driver :firefox do |app|
    Capybara::Selenium::Driver.new(app, :browser => :firefox)
  end
  Capybara.register_driver :chrome do |app|
    Capybara::Selenium::Driver.new(app, :browser => :chrome)
  end

  Capybara.run_server = false
  Capybara.current_driver = :firefox
  Capybara.app_host = 'http://localhost:3000'
  
  content_server = ""
  
  # Intialize for the platform we are testing
  if args.platform
    
    platform = args.platform
    
    if platform == "web"
      address_start = "http://localhost:3000/apps/"
      content_server = "http://localhost:3000"
    end
    
    # Untested
    if platform == "firefox"
      
      # Assign the path to find the applications in the extension
      Capybara.app_host = "chrome://privly/content/privly-applications/"
      address_start = "" # todo, should this take the path from above?
      
      # package the extension
      system( "../../../package.sh" )
      
      # Load the Firefox driver with the extension installed
      profile = Selenium::WebDriver::Firefox::Profile.new
      profile.add_extension("../../../PrivlyFirefoxExtension.xpi")

      # todo, register the extension drivers
      Capybara.register_driver :firefox_extension do |app|
        Capybara::Selenium::Driver.new(app, :browser => :firefox, :profile => profile)
      end
      Capybara.current_driver = :firefox_extension
      
      # Assign the content server to the remote server
      content_server = "https://dev.privly.org"
    end
    
    if platform == "safari" or platform == "ie" or platform == "chrome"
      address_start = "TODO"
      content_server = "https://dev.privly.org"
      puts "This platform is not integrated into testing"
      exit 0

      Capybara.register_driver :chrome_extension do |app|
        Capybara::Selenium::Driver.new(app, :browser => :chrome)
      end

    end
    
  end
  
  if args.content_server
    content_server = args.content_server
  end
  
  # Default to building everything that is not experimental
  release_status = "deprecated"
  if args.release_status
    release_status = args.release_status
  end
  
  # Assign the content server domain. If the platform
  # being tested is "web" then this parameter is ignored
  # and the localhost:3000 domain is used.
  address_start = "http://localhost:3000/apps/"
  if args.address_start
    address_start = args.address_start
  end
  
  testing_module = ClickTesting::Test.new

  manifest_files = Dir["*/manifest.json"]
  manifest_files.each do |manifest_file|
    json = JSON.load(File.new(manifest_file))
    json.each do |app_manifest|
      
      outfile_path = app_manifest["outfile_path"]
      if app_manifest["platforms"] and not app_manifest["platforms"].include?(platform)
        puts "Skipping due to target platform: " + outfile_path
        next
      end
      
      release_titles = ["experimental", "deprecated", "alpha", "beta", "release"]
      unless release_titles.index(app_manifest["release_status"]) >= release_titles.index(release_status)
        puts "Skipping due to release status: " + outfile_path
        next
      end

      # Pages to be tested
      page_url = address_start+outfile_path
      testing_module.test_app(page_url, Capybara, content_server, app_manifest["subtemplate_dict"])
    end
  end
end
