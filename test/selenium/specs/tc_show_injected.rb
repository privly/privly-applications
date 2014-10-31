# This test case checks whether the content at test.privly.org
# injects into the host page properly. These specs should only
# be run if the extension is loaded into the web browser.
#
# Note/todo: this could be significantly improved since it is only
# checking whether well-formed links are being injected. In particular,
# it is not checking wether non-whitelisted links are being injected or
# whether misdirected links are being injected.
#
class TestInjected < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # pass
  end

  def test_showing_injected_posts

    if not @@privly_extension_active
      return
    end

    # Open these pages
    test_pages = [
      "http://test.privly.org/test_pages/whitelist.html",
      "http://test.privly.org/test_pages/url_parameters.html",
      "http://test.privly.org/test_pages/nonwhitelist.html",
      "http://test.privly.org/test_pages/misdirection.html",
      "http://test.privly.org/test_pages/iframes.html"
    ]

    test_pages.each do |test_page|
      visit test_page
      links = page.all(:css, ".replace_link")
      links.each do |link|
        link.find(:xpath, '../iframe')
      end
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end