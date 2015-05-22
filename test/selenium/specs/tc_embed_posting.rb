#encoding:utf-8
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
    page.click_button('save_btnAppearance')
  end

  def click_privly_button_of(element)
    element.click
    w = element.native.size.width / 2
    h = element.native.size.height / 2
    page.driver.browser.action.move_to(element.native).move_by(w - 15, -h + 15).click.perform
  end

  def test_nested_iframe
    if not @@privly_extension_active
      return
    end
    
    # log each level frame
    # thus we can easily jump to the root and then jump back
    @_frame_handles = []

    def click_textareas
      # for each textarea on the page
      textareas = all(:css, 'textarea')
      textareas.each do |textarea|
        click_privly_button_of textarea

        # check embed-posting dialog at the top frame
        # switch to top frame, check whether embed-posting frame is created
        page.driver.browser.switch_to.default_content
        assert has_selector?('[src*="new_embed"]')

        # switch to embed-posting frame, click Cancel
        page.driver.browser.switch_to.frame(find(:css, '[src*="new_embed"]').native)
        find(:css, '[name="cancel"]').click
        
        # switch to top frame, check whether embed-posting frame is destroyed
        page.driver.browser.switch_to.default_content
        assert_no_selector('[src*="new_embed"]')
        
        # switch back to the original frame
        @_frame_handles.each { |fh| page.driver.browser.switch_to.frame(fh) }
      end

      # for each iframe on the page, we test its textarea and iframes inside it
      iframes = all(:css, 'iframe')
      iframes.each do |iframe|
        within_frame iframe do
          @_frame_handles << iframe.native
          click_textareas
          @_frame_handles.pop
        end
      end
    end

    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_iframes.html')
    click_textareas
  end

  def test_forwarding_submit_button
    if not @@privly_extension_active
      return
    end

    def expect_submit_button(element, submit_caption)
      click_privly_button_of element
      within_frame find(:css, '[src*="new_embed"]') do
        assert has_selector?('[name="submit"]', visible: true)
        assert has_selector?('[name="done"]', visible: false)
        assert find(:css, '[name="submit"]').has_content?(submit_caption)
        find(:css, '[name="cancel"]').click
      end
      assert_no_selector('[src*="new_embed"]')
    end

    def expect_done_button(element)
      click_privly_button_of element
      within_frame find(:css, '[src*="new_embed"]') do
        assert has_selector?('[name="submit"]', visible: false)
        assert has_selector?('[name="done"]', visible: true)
        find(:css, '[name="cancel"]').click
      end
      assert_no_selector('[src*="new_embed"]')
    end

    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_proxy.html')
    expect_submit_button find(:css, '#test1 .textbox'), '发布'
    expect_done_button find(:css, '#test2 .textbox')
    expect_submit_button find(:css, '#test3 .textbox'), 'Comment on this commit'
    expect_done_button find(:css, '#test4 .textbox')
    expect_done_button find(:css, '#test5 .textbox')
    expect_done_button find(:css, '#test6 .textbox')
  end

  def test_forwarding_enter_event
    if not @@privly_extension_active
      return
    end

    def expect_closed_when(element, keys)
      click_privly_button_of element
      assert has_selector?('[src*="new_embed"]')
      within_frame find(:css, '[src*="new_embed"]') do
        find(:css, 'textarea').native.send_keys keys
      end
      assert_no_selector('[src*="new_embed"]')
    end

    if RbConfig::CONFIG['host_os'].match /darwin|mac os/
      meta_control = :meta
    else
      meta_control = :control
    end

    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_proxy.html')
    
    expect_closed_when find(:css, '#test1 .textbox'), [meta_control, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), [:meta, :enter]
    expect_closed_when find(:css, '#test2 .textbox'), :enter
    expect_closed_when find(:css, '#test3 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test3 .textbox'), [:meta, :enter]
    expect_closed_when find(:css, '#test6 .textbox'), [:control, :enter]
    expect_closed_when find(:css, '#test6 .textbox'), [:meta, :enter]
  end

  def test_embed_dialog_not_closed
    if not @@privly_extension_active
      return
    end

    def expect_not_closed(element)
      click_privly_button_of element
      assert has_selector?('[src*="new_embed"]')
      sleep 2 # wait 1 second
      assert has_selector?('[src*="new_embed"]')
      within_frame find(:css, '[src*="new_embed"]') do
        find(:css, '[name="cancel"]').click
      end
      assert_no_selector('[src*="new_embed"]')
    end

    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_proxy.html')
    expect_not_closed find(:css, '#test7 .textbox')
    expect_not_closed find(:css, '#test8 .textbox')
  end

  def teardown
    page.driver.browser.get(@@privly_test_set[0][:url])
    page.driver.browser.navigate.refresh # force reload
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
