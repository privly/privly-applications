# This test case checks whether the content at test.privly.org
# injects into the host page properly. These specs only
# run if the extension is loaded into the web browser.
class TestInjected < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # pass
  end

  def test_google_groups_injection

    if not @@privly_extension_active
      return
    end

    visit "https://groups.google.com/forum/#!topic/privly/f6iBZ8Z-YMQ/discussion"
    page.assert_selector("iframe[data-privly-display='true']", :count => 1)
  end

  def test_twitter_injection

    if not @@privly_extension_active
      return
    end

    visit "https://twitter.com/PrivlyTest/status/308809779655102464"
    page.assert_selector("iframe[data-privly-display='true']", :count => 1)
  end

  def test_showing_injected_posts

    if not @@privly_extension_active
      return
    end

    # Open these pages
    test_pages = [
      "http://test.privly.org/test_pages/whitelist.html",
      "http://test.privly.org/test_pages/url_parameters.html",
      "http://test.privly.org/test_pages/misdirection.html",
      "http://test.privly.org/test_pages/iframes.html"
    ]
    test_pages.each do |test_page|
      visit test_page
      links = page.all(:css, ".replace_link")
      links.each do |link|
        assert link.has_xpath?('..//iframe')
      end
    end
  end

  def test_showing_injected_posts_reddit

    if not @@privly_extension_active
      return
    end

    visit "http://www.reddit.com/r/Privly/comments/2xipzl/privly_demonstration_link/"
    page.assert_selector("iframe[data-privly-display='true']", :count => 1)
  end

  def test_non_whitelisted

    if not @@privly_extension_active
      return
    end

    # Open these pages
    test_pages = ["http://test.privly.org/test_pages/nonwhitelist.html"]
    test_pages.each do |test_page|
      visit test_page
      assert page.has_no_xpath?('//iframe') # The page should have no iframes.
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
