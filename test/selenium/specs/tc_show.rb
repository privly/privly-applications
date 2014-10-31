# Test all the show applications in their non-injected form.
# todo: implement actual tests here.
class TestShow < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # pass
  end

  def test_showing_plain_post
    to_append = "?privlyOriginalURL=https%3A%2F%2Fprivlyalpha.org%2Fapps%2FPlainPost%2Fshow%3FprivlyApp%3DPlainPost%26privlyInject1%3Dtrue%26random_token%3D%26privlyDataURL%3Dhttps%253A%252F%252Fprivlyalpha.org%252Fposts%252F2.json%23privlyInject1"
    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "show" and
        to_test[:manifest_dictionary]["name"] == "PlainPost"
        url = to_test[:url]+to_append
        page.driver.browser.get(url);
        passes = page.has_text?('The Apology')
        assert passes
      end
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end