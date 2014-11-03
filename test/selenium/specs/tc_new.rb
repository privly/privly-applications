# Test the creation of posts
class TestNew < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    # Set the content server
  end

  def test_creating_posts

    @@privly_test_set.each do |to_test|
      if to_test[:manifest_dictionary]["action"] == "new" and
        not to_test[:manifest_dictionary]["name"] == "Help" and
        not to_test[:manifest_dictionary]["name"] == "Login"

        page.driver.browser.get("http://test.privly.org");

        # Load the HTML page with Webdriver
        page.driver.browser.get(to_test[:url]);
        setServer = "ls.setItem('posting_content_server_url', '" +
          to_test[:content_server] + "')"
        page.execute_script(setServer);
        page.driver.browser.get(to_test[:url]); # Re-load the page after we set the server

        if not page.find('#content').visible?
          # Log the user in
            login_button = page.all(:css, '.login_url')#page.driver.browser.find_element(:class => "login_url")
            if login_button
              login_button[0].click
            end
            user = "development@priv.ly"
            password = "password"
            fill_in 'user_email', :with =>  user
            fill_in 'user_password', :with => password
            domain = page.evaluate_script('privlyNetworkService.contentServerDomain()');
            click_on ('Login to ' + domain)
        end

        fill_in 'content', :with =>  "Hello WebDriver!"
        click_on ('save')
        urls = page.find('.privlyUrl', :visible => true)
        assert urls.visible?
      end
    end
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
