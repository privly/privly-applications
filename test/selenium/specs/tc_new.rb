# Test CRUD on posts for each application
class TestNew < Test::Unit::TestCase

  # Helps perform authentication with the content server
  require_relative "auth_helper"

  include AuthHelper # Helps with login/logout
  include Capybara::DSL # Provides for Webdriving

  def setup
    page.driver.browser.get(@@privly_test_set[0][:url])
    login(@@privly_test_set[0][:content_server])
  end

  # Test post creation for each application that presents a "new" action.
  def test_creating_posts
    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "new" and
        not to_test[:manifest_dictionary]["name"] == "Help" and
        not to_test[:manifest_dictionary]["name"] == "Login"
        page.driver.browser.get(to_test[:url]) # Re-load the page after we set the server
        fill_in 'content', :with =>  "Hello WebDriver!"
        click_on ('save')
        urls = page.find('.privlyUrl', :visible => true)
        assert urls.visible?
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

      # Refresh the page we are going to test creation
      page.driver.browser.get(to_test[:url])

      # Create some content
      fill_in 'content', :with =>  "Hello WebDriver!"
      Selenium::WebDriver::Support::Select.new(page.driver.browser.find_element(:id, "seconds_until_burn")).select_by(:text, "1 Day")
      find_button("save").click
      page.find(:css,"span.privlyUrl").click

      # Open the created content in the "show" endpoint
      new_window = window_opened_by do
        click_link("local_address")
      end
      assert page.has_text?("Copy and paste")
      within_window new_window do

        assert page.has_text?("Hello WebDriver!")

        # Open the editing menu
        find_by_id("edit_nav").click
        page.driver.browser.find_element(:css, "span.glyphicon.glyphicon-edit").click

        # Change the content and submit it
        fill_in 'edit_text', :with =>  "Updated!"
        find_button("Update").click

        # Refresh
        page.driver.browser.get(page.evaluate_script("window.location.href"))

        # Make sure the refreshed page has the new content
        assert page.has_text?('Updated!')
      end
    end
  end

  def teardown
    page.driver.browser.get(@@privly_test_set[0][:url])
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
