# Test the creation of posts
class TestNew < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # pass
  end

  def test_creating_posts

    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "new" and
        not to_test[:manifest_dictionary]["name"] == "Help" and
        not to_test[:manifest_dictionary]["name"] == "Login"

        # Load the HTML page with Webdriver
        visit to_test[:url]

        if not page.driver.browser.find_element(:id, 'content').displayed?
          # Log the user in
            login_button = page.driver.browser.find_element(:class => "login_url")
            if login_button
              login_button.click
            end
            user = "development@priv.ly"
            password = "password"
            fill_in 'user_email', :with =>  user
            fill_in 'user_password', :with => password
            click_on ('Login to http://localhost:3000')
        end

        fill_in 'content', :with =>  "Hello WebDriver!"
        click_on ('save')
        assert page.find('.privlyUrl').visible?
      end
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
