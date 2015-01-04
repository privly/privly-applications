# Test CRUD on posts for each application
class TestNew < Test::Unit::TestCase

  # Helps perform authentication with the content server
  require_relative "auth_helper"

  include AuthHelper # Helps with login/logout
  include Capybara::DSL # Provides for Webdriving

  def setup
  end

  # Test post creation for each application that presents a "new" action.
  def test_creating_posts
    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "new" and
        not to_test[:manifest_dictionary]["name"] == "Help" and
        not to_test[:manifest_dictionary]["name"] == "Login"
        page.driver.browser.get(to_test[:url]) # Re-load the page after we set the server
        login(to_test[:content_server])
        fill_in 'content', :with =>  "Hello WebDriver!"
        click_on ('save')
        urls = page.find('.privlyUrl', :visible => true)
        assert urls.visible?
        logout
      end
    end
  end

  # Test CRUD on each application that presents a "new" action.
  def test_create_update_destroy
    @@privly_test_set.each do |to_test|
      if not to_test[:manifest_dictionary]["action"] == "new" or
        to_test[:manifest_dictionary]["name"] == "Login" or
        to_test[:manifest_dictionary]["name"] == "Help"
        next
      end

      # Navigate to the page we are testing
      page.driver.browser.get(to_test[:url])

      # Set and login to the content server
      login(@@privly_test_set[0][:content_server])

      # Refresh the page we are going to test creation
      page.driver.browser.get(to_test[:url])

      # Create some content
      fill_in 'content', :with =>  "Hello WebDriver!"
      Selenium::WebDriver::Support::Select.new(page.driver.browser.find_element(:id, "seconds_until_burn")).select_by(:text, "1 Day")
      find_button("save").click
      page.find(:css,"span.privlyUrl").click

      # Open the created content in the "show" endpoint
      click_link("local_address")

      # Switch focus to the window that was just opened
      page.driver.browser.switch_to.window(page.driver.browser.window_handles.last)

      # Open the editing menu
      click_link("edit_nav")
      page.driver.browser.find_element(:css, "span.glyphicon.glyphicon-edit").click

      # Change the content and submit it
      fill_in 'edit_text', :with =>  "Updated!"
      find_button("Update").click

      # Refresh
      page.driver.browser.get(page.evaluate_script("window.location.href"))

      # Make sure the refreshed page has the new content
      assert page.has_text?('Updated!')

      logout
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
