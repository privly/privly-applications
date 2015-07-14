#
# See README.md for details.
#
# Run all the specs that are defined in the all_specs.rb
# file. For a listing of the options, you should run
# `ruby run_all.rb` without specifying any parameters.
#
require 'optparse' # Options parsing
require 'json' # Crawling the manifest files to decide what to test
require_relative "configurations" # The platforms we may test

# Change the directory to this script's directory
Dir.chdir File.expand_path(File.dirname(__FILE__))

# Specify the required options
args = {}
optsHelp = ""
OptionParser.new do |opts|
  opts.banner = "Usage: ruby run_all.rb [options]"
  opts.on('-p', '--platform PLATFORM', 'The target platform (firefox_web, firefox_extension, chrome_web, chrome_extension, safari_web, sauce_chrome_web, sauce_firefox_web, sauce_safari_web, sauce_firefox_extension, sauce_chrome_extension)') { |v| args[:platform] = v }
  opts.on('-r', '--release-status RELEASE', 'The target release stage (experimental, deprecated, alpha, beta, release)') { |v| args[:release_status] = v }
  opts.on('-c', '--content-server SERVER', 'The content server (http://localhost:3000)') { |v| args[:content_server] = v }
  optsHelp = opts.help
end.parse!

puts "You passed the arguments: #{args}"

# Exit if three arguments were not supplied
if not args.length == 3
  puts "\nYou must specify all three arguments\n\n"
  puts optsHelp
  exit 1
end

# Build the data structure used by some specs to determine what to test
def initialize_CRUD_tests(args)

  if args[:content_server]
    content_server = args[:content_server]
  end

  if args[:release_status]
    release_status = args[:release_status]
  end

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
end

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
#                    This requires a webserver to run on localhost:3000
#  sauce_chrome_extension: run Chrome on saucelabs with an extension.
#  chrome_web: run Chrome locally without an extension.
#              This requires a webserver to run on localhost:3000
#  chrome_extension: run Chrome locally with an extension.
#  sauce_safari_web: run Safari on saucelabs without an extension.
#                    This requires a webserver to run on localhost:3000
#  safari_web: run Safari locally without an extension.
#              This requires a webserver to run on localhost:3000
if args[:platform]
  platform = args[:platform]
end

# Global variable indicating whether the extension
# is installed
@@privly_extension_active = platform.include?("extension")

# Assign the name of the browser controlled by Selenium
if platform.include? "chrome"
  @browser = "chrome"
elsif platform.include? "firefox"
  @browser = "firefox"
elsif platform.include? "safari"
  @browser = "safari"
elsif platform.include? "opera"
  @browser = "opera"
elsif platform.include? "ie"
  @browser = "ie"
end

# Confirms that the user is running the tests
# within the proper context
def sanity_check(expected_string)
  unless `pwd`.include? expected_string
    puts "You are testing: " + expected_string
    puts "but we did not find this string in the code's path."
    puts "Thus, we are refusing to run any tests."
    puts "Comment out the sanity check or rename a folder in your path."
    exit 1
  end
end

# Configure for the current platform
if platform == "sauce_firefox_web"
  sanity_check "privly-web"
  configure_for_sauce_firefox_web(args)
elsif platform == "sauce_chrome_web"
  sanity_check "privly-web"
  configure_for_sauce_chrome_web(args)
elsif platform == "sauce_safari_web"
  sanity_check "privly-web"
  configure_for_sauce_safari_web(args)
elsif platform == "firefox_web"
  sanity_check "privly-web"
  configure_for_firefox_web(args)
elsif platform == "chrome_web"
  sanity_check "privly-web"
  configure_for_chrome_web(args)
elsif platform == "safari_web"
  sanity_check "privly-web"
  configure_for_safari_web(args)
elsif platform == "firefox_extension"
  sanity_check "privly-firefox"
  configure_for_firefox_extension(args)
elsif platform == "sauce_firefox_extension"
  sanity_check "privly-firefox"
  configure_for_sauce_firefox_extension(args)
elsif platform == "chrome_extension"
  sanity_check "privly-chrome"
  configure_for_chrome_extension(args)
elsif platform == "sauce_chrome_extension"
  sanity_check "privly-chrome"
  configure_for_sauce_chrome_extension(args)
else
  puts "The platform you selected was not recognized or is not supported"
  puts "Note that Safari and Internet Explorer are integrated"
  exit 1
end

initialize_CRUD_tests(args)

# Run all the tests
require_relative "specs/ts_all_specs"
