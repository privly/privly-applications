# Test whether the Safari extension works.
class TestShow < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
  end

  # Test the ability to navigate to a specific URL and check for the injected iframe
  def test_safari_extension

    # Don't test it if there is no extension
    if not @@privly_extension_active
      return
    end
    visit "http://web.iiit.ac.in/~sambuddha.basu/privly_safari_test.html"
    page.assert_selector("iframe[id='ifrm0']", :count => 1)
    page.assert_selector("iframe[src='" + Capybara.app_host + "/privly-applications/PlainPost/show.html?privlyOriginalURL=https%3A%2F%2Fpriv.ly%2Fposts%2F2%3FprivlyApp%3DPlainPost%23privlyInject1']")
    page.assert_selector("iframe[id='test_iframe']", :count => 1)
    page.assert_selector("iframe[srcdoc='it works']", :count => 1)

  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
