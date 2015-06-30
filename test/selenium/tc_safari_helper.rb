class ChromeHelper < Test::Unit::TestCase
  include Capybara::DSL # Provides for Webdriving

  # Ensure that the proper URL for the browser is assigned
  def test_assigned_url

    # Navigate to the privly test page to get the extension base URL
    page.driver.browser.get("http://test.privly.org/test_pages/url_parameters.html")
    newest_window = page.driver.browser.window_handles.last
    page.driver.switch_to_window newest_window
    # Give the page 15 seconds to inject the iframe
    for i in 0..15
      iframe = page.driver.browser.find_element(:id, "ifrm0")
      address = iframe.attribute("src")
      if address.include? "safari-extension://"
        break
      end
      sleep 1
    end
    app_host = "safari-extension://" + address.split("/")[2] + "/" + address.split("/")[3]
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
