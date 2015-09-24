# Test embed-posting
class TestEmbedPosting < Test::Unit::TestCase

  # detect OS
  require 'rbconfig'

  # Helps perform authentication with the content server
  require_relative "auth_helper"

  include AuthHelper # Helps with login/logout
  include Capybara::DSL # Provides for Webdriving

  def setup
    if not @@privly_extension_active
      return
    end
    page.driver.browser.get(@@privly_test_set[0][:url])
    login(@@privly_test_set[0][:content_server])

    # enable Privly button
    @options_url = @@privly_applications_folder_path + '/Pages/ChromeOptions.html'
    page.driver.browser.get(@options_url)
    page.uncheck('disableBtn')
  end

  def click_privly_button_of(element, focus = true)
    element.click if focus
    w = element.native.size.width / 2
    h = element.native.size.height / 2
    page.driver.browser.action.move_to(element.native).move_by(w - 15, -h + 15).click.perform
  end

  def test_forwarding_enter_event
    if not @@privly_extension_active
      return
    end

    def expect_closed_when(element, keys)
      click_privly_button_of element
      assert has_selector?('[src*="seamless.html"]')
      within_frame find(:css, '[src*="seamless.html"]') do
        find(:css, 'textarea').native.send_keys keys
      end
      assert_no_selector('[src*="seamless.html"]')
    end

    if RbConfig::CONFIG['host_os'].match /darwin|mac os/
      meta_control = :meta
    else
      meta_control = :control
    end

    page.driver.browser.get('http://test.privly.org/test_pages/seamlessposting_forward.html')
    
    expect_closed_when find(:css, '#test1 .textbox'), [meta_control, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), [:meta, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), :enter
    expect_closed_when find(:css, '#test3 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test3 .textbox'), [:meta, :enter]
    expect_closed_when find(:css, '#test4 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test4 .textbox'), [:meta, :enter]
  end

  def test_seamless_posting_form_not_closed
    if not @@privly_extension_active
      return
    end

    def expect_not_closed(element)
      click_privly_button_of element  # open
      assert has_selector?('[src*="seamless.html"]')
      sleep 2 # wait
      assert has_selector?('[src*="seamless.html"]')
      click_privly_button_of element, false  # close
      assert_no_selector('[src*="seamless.html"]')
    end

    page.driver.browser.get('http://test.privly.org/test_pages/seamlessposting_forward.html')
    expect_not_closed find(:css, '#test5 .textbox')
    expect_not_closed find(:css, '#test6 .textbox')
  end

  def teardown
    page.driver.browser.get(@@privly_test_set[0][:url])
    page.driver.browser.navigate.refresh # force reload
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end