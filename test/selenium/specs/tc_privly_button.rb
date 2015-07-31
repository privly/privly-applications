# Test Privly button
class TestPrivlyButton < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    if not @@privly_extension_active
      return
    end
    # enable Privly button
    @options_url = @@privly_applications_folder_path + '/Pages/ChromeOptions.html'
    page.driver.browser.get(@options_url)
    page.uncheck('disableBtn')
  end

  def test_showing_button

    if not @@privly_extension_active
      return
    end

    visit 'http://test.privly.org/test_pages/privly_button.html'

    editable_scope = page.all(:css, '[data-test-scope]')
    editable_scope.each do |scope|
      editable_elements = scope.all(:css, '[data-test-click]')
      editable_elements.each do |element|
        element.click
        assert scope.has_selector?('[data-privly-role="button"]', :visible => true, :count => 1)
      end
    end

    test_iframes = page.all(:css, '[data-test-iframe]')
    test_iframes.each do |iframe|
      within_frame iframe do
        editable_elements = all(:css, '[data-test-click]')
        editable_elements.each do |element|
          element.click
          assert page.has_selector?('[data-privly-role="button"]', :visible => true, :count => 1)
        end
      end
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end