# Test Message functionality
class TestMessage < Test::Unit::TestCase
  
  # detect OS
  require 'rbconfig'

  include Capybara::DSL # Provides for Webdriving

  def setup
    if not @@privly_extension_active
      return
    end
  end

  def test_message

    # open message testing url (privly_application) [TAB 1]
    @background_url = Capybara.app_host + "/background.html"
    @privly_app_url = @@privly_applications_folder_path + "Pages/MessageTest.html"
    @content_script_url = 'http://test.privly.org/'
    page.driver.browser.get(@content_script_url)
    page.execute_script("window.location.reload();")

    # open a normal page (content scripts) [TAB 2]
    page.execute_script("window.open();")
    page.driver.browser.switch_to.window(page.driver.browser.window_handles.last)
    page.driver.browser.get(@privly_app_url)
    # sometimes Chrome extension engine is not initialized at this time
    # we need to refresh the page to make sure it works
    # TODO: better solutions
    page.execute_script("window.location.reload();")
    
    # now we are under TAB 2
    # start testing
      
    fill_in 'data', :with => 'magic_1'
    find(:css, '[name="to_extension"]').click
    assert page.find(:css, '#response').has_text?('pong/BACKGROUND_SCRIPT/magic_1/' + @background_url)
    assert page.find(:css, '#response').has_text?('pongAsync/BACKGROUND_SCRIPT/magic_1/' + @background_url)
    find(:css, '[name="clear"]').click

    fill_in 'data', :with => 'magic_2'
    find(:css, '[name="to_privly_app"]').click
    assert page.find(:css, '#response').has_text?('pong/PRIVLY_APPLICATION/magic_2/' + @privly_app_url)
    assert page.find(:css, '#response').has_text?('pongAsync/PRIVLY_APPLICATION/magic_2/' + @privly_app_url)
    find(:css, '[name="clear"]').click

    # todo: send_to_content_script doesn't works in everywhere
    # should we add a bridge layer?
    
    # close
    page.execute_script 'window.close();'

  end

end
