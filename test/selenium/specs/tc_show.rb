# Test all the injectable show applications in their non-injected form.
class TestShow < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
  end

  # Test the ability of the app to pull down content from the privly
  def test_showing_post_extension

    # Don't test it if there is no extension
    if not @@privly_extension_active
      return
    end

    # These two addresses will be used for testing these applications
    testing_strings = {
      "PlainPost" => "?privlyOriginalURL=https%3A%2F%2Fprivlyalpha.org%2Fapps%2FPlainPost%2Fshow%3FprivlyApp%3DPlainPost%26privlyInject1%3Dtrue%26random_token%3D%26privlyDataURL%3Dhttps%253A%252F%252Fprivlyalpha.org%252Fposts%252F2.json%23privlyInject1",
      "Message" => "?privlyOriginalURL=https%3A%2F%2Fprivlyalpha.org%2Fapps%2FMessage%2Fshow%3FprivlyApp%3DMessage%26privlyInject1%3Dtrue%26random_token%3D1ff0c35ce7%26privlyDataURL%3Dhttps%253A%252F%252Fprivlyalpha.org%252Fposts%252F1731.json%253Frandom_token%253D1ff0c35ce7%23privlyLinkKey%3DMuF%2BVWCmD%2FejlxeZQNcepvpXPIYhhfUD8M6lSRuak9k%3D"
    }

    # Loop over the applications and test them with their associated URL
    @@privly_test_set.each do |to_test|
      if not testing_strings.has_key? to_test[:manifest_dictionary]["name"] or
        not to_test[:manifest_dictionary]["action"] == "show"
        next
      end
      to_append = testing_strings[to_test[:manifest_dictionary]["name"]]
      url = to_test[:url]+to_append
      page.driver.browser.get(url)
      assert page.has_text?('The Apology')
      assert page.has_text?('Metadata')
      assert page.has_text?('https://privlyalpha.org/apps/')
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
