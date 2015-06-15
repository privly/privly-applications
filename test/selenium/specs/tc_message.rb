# Test Message functionality
class TestMessage < Test::Unit::TestCase
  
  include Capybara::DSL # Provides for Webdriving

  def test_message_between_extension_and_application

    if not @@privly_extension_active
      return
    end

    @background_url = Capybara.app_host + "/background.html"
    @privly_app_url = @@privly_applications_folder_path + "Pages/MessageTest.html"

    page.driver.browser.get(@privly_app_url)
    # sometimes Chrome extension engine is not initialized at this time
    # we need to refresh the page to make sure it works
    # TODO: better solutions
    page.execute_script("window.location.reload();")

    fill_in 'data', :with => 'magic_1'
    find(:css, '[name="to_extension"]').click
    assert page.find(:css, '#response').has_text?('pong/BACKGROUND_SCRIPT/magic_1/' + @background_url)
    assert page.find(:css, '#response').has_text?('pongAsync/BACKGROUND_SCRIPT/magic_1/' + @background_url)
    find(:css, '[name="clear"]').click

  end

  def test_message_between_application_and_application

    if not @@privly_extension_active
      return
    end

    @background_url = Capybara.app_host + "/background.html"
    @privly_app_url = @@privly_applications_folder_path + "Pages/MessageTest.html"

    page.driver.browser.get(@privly_app_url)
    page.execute_script("window.location.reload();")

    fill_in 'data', :with => 'magic_2'
    find(:css, '[name="to_privly_app"]').click
    assert page.find(:css, '#response').has_text?('pong/PRIVLY_APPLICATION/magic_2/' + @privly_app_url)
    assert page.find(:css, '#response').has_text?('pongAsync/PRIVLY_APPLICATION/magic_2/' + @privly_app_url)
    find(:css, '[name="clear"]').click

  end

end
