# Test embed-posting
class TestEmbedPosting < Test::Unit::TestCase

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

  def test_nested_iframe
    page.driver.browser.get('http://test.privly.org/test_pages/embedposting_iframes.html')

    # log each level frame
    # thus we can easily jump to the root and then jump back
    @_frame_handles = []

    def click_textareas
      # for each textarea on the page
      textareas = all(:css, 'textarea')
      textareas.each do |textarea|
        # focus textarea
        textarea.click

        # click Privly button
        w = textarea.native.size.width / 2
        h = textarea.native.size.height / 2
        page.driver.browser.action.move_to(textarea.native).move_by(w - 15, -h + 15).click.perform

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

    click_textareas

  end

  def teardown
    page.driver.browser.get(@@privly_test_set[0][:url])
    logout
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
