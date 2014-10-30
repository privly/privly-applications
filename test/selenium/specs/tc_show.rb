# Test all the show applications in their non-injected form.
# todo: implement actual tests here.
class TestShow < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # pass
  end

  def test_showing_posts
    
    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "show"
        # todo
        # Load the HTML page with Webdriver
        visit to_test[:url]
      end

    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end