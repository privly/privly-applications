class TestPostingProcess < Test::Unit::TestCase

  # Helps perform authentication with the content server
  require_relative "auth_helper"
  require "uri" # Provides regex for valid URIs
  include AuthHelper # Helps with login/logout
  include Capybara::DSL # Provides for Webdriving

  def setup
    page.driver.browser.get(@@privly_test_set[0][:url])
    # Makes sure that the privly button is enabled
    click_on ('Options')
    click_on ('Extension Options')
    privlyDisableBtn = find_by_id('disableBtn')
    if privlyDisableBtn.checked?
      privlyDisableBtn.click()
    end
    @privly_testing = 'DOM'
    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_iframes.html')
  end

  # Helper Functions
  #
  # Clicks the privly button and returns the resulting privly application
  # window
  def click_privly_button
    # Click on the test element
    if @privly_testing == 'IFRAME'
      find_by_id('test2_textarea').click
    else
      find_by_id('test1_textarea').click
    end
    # Give enough time for the privly button to show up
    sleep 1
    new_window = window_opened_by do
      # Click on privly button
      # TODO - use a more precise locator
      # presence of another span element in the test page will cause tests to fail
      find('span').click
    end
    new_window
  end
  # Enters a message in the privly application
  def enter_message(app_window)
    within_window app_window do
      assert page.has_text?('login')
      login(@@privly_test_set[0][:content_server])
      fill_in 'content', :with => 'Hello WebDriver!'
      Selenium::WebDriver::Support::Select.new(page.driver.browser.find_element(:id, 'seconds_until_burn')).select_by(:text, '1 Day')
      find_button('save').click
    end
    # Give some time to close the app window
    sleep 1.5
  end
  # Checks for a successful post
  def assert_successful_post(app_window)
    # Makes sure the posting application window is closed
    assert page.driver.browser.window_handles.length == 1
    assert app_window.closed?
    # Makes sure the privly link is posted
    if @privly_testing == 'IFRAME'
      assert find_by_id('test2_textarea').value =~ /\A#{URI::regexp(['http', 'https'])}\z/
    else
      assert find_by_id('test1_textarea').value =~ /\A#{URI::regexp(['http', 'https'])}\z/
    end
  end

  ##
  # Test Cases
  ##

  # Tests the posting process using the privly button.
  def test_posting_process
    new_window = click_privly_button
    enter_message(new_window)
    assert_successful_post(new_window)
  end
  # Tests if an already pending post works after a new post attempt
  def test_pending_post
    new_window = click_privly_button
    # Click on the button again, this should not open a new window
    # because there's already pending post.
    find_by_id('test1_textarea').click
    sleep 1
    find('span').click
    # Should not open a new window
    assert page.driver.browser.window_handles.length == 2
    # Continue with the posting process
    enter_message(new_window)
    assert_successful_post(new_window)
  end
  # Tests if a new post works after a canceled post
  def test_canceled_post
    new_window = click_privly_button
    # Close the posting privly app window
    # This should cancel the posting process
    within_window new_window do
      new_window.close
    end
    # Give some time to close the app window
    sleep 1
    # Start a new posting process
    new_window = click_privly_button
    enter_message(new_window)
    assert_successful_post(new_window)
  end
  # Tests if the posting process works for an iframe
  def test_posting_iframe
    @privly_testing = 'IFRAME'
    page.driver.browser.switch_to.frame('test2_iframe')
    new_window = click_privly_button
    enter_message(new_window)
    page.driver.browser.switch_to.frame('test2_iframe')
    assert_successful_post(new_window)
  end

  def teardown
    remove_instance_variable(:@privly_testing)
    page.driver.browser.get(@@privly_test_set[0][:url])
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end
end
