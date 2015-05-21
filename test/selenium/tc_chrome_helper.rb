class ChromeHelper < Test::Unit::TestCase
  include Capybara::DSL # Provides for Webdriving

  # Ensure that the proper URL for the browser is assigned
  def test_assigned_url

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
        assert false
        exit 1
      end
      sleep 1
    end
    app_host = "chrome-extension://" + address.split("/")[2]
    Capybara.app_host = app_host
    @@privly_applications_folder_path = Capybara.app_host + "/privly-applications/"
    @@privly_test_set.each {|t|
      t[:url] = @@privly_applications_folder_path + t[:url]
    }
  end
  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end
end
