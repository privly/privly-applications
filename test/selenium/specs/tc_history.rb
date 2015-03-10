#Test the history page
class TestHistory < Test::Unit::TestCase

  # Helps perform authentication with the content server
  require_relative "auth_helper"

  include AuthHelper # Helps with login/logout
  include Capybara::DSL # Provides for Webdriving

  def setup
    page.driver.browser.get(@@privly_test_set[0][:url])
    login(@@privly_test_set[0][:content_server])

    #Create a message to test with
    click_on ('New Message')
    fill_in 'content', :with =>  "Hello WebDriver!"
    click_on ('save')
  end

  def test_preview_button
    #Navigate to the history page
    click_on ('History')
    assert page.has_text?("History")
    assert page.has_text?("Created")
    assert page.has_text?("Burnt After")
    assert page.has_text?("Updated")

    #Click the first preview button link
    find(".btn", match: :first).click
    modal_dialog = page.find(:css,".modal-dialog")
    assert modal_dialog.visible?
    assert page.has_text?("Hide Preview")
    assert page.has_text?("Destroy Content")

    #Close the pop-up and make sure that it closed
    click_on ('Hide Preview')
    assert page.has_no_text?("Hide Preview")
    assert page.has_no_text?("Destroy Content")
  end

  def teardown
    page.driver.browser.get(@@privly_test_set[0][:url])
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
