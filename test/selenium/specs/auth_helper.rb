# Help sign the user into content servers.
# todo: implement this for arbitrary content servers, it currently
# only works for localhost:3000 since production servers don't
# typically have the development@priv.ly user.
module AuthHelper

  # Set the content server for the current scripting environment
  # then click on the login button and log the user into the localhost:3000
  # server
  def login(content_server)
    setServer = "ls.setItem('posting_content_server_url', '" +
      content_server + "')"
    page.execute_script(setServer)
    page.driver.browser.navigate.refresh
    login_button = page.all(:css, '.login_url')
    login_button[0].click
    user = "development@priv.ly"
    password = "password"
    fill_in 'user_email', :with =>  user
    fill_in 'user_password', :with => password
    domain = page.evaluate_script('privlyNetworkService.contentServerDomain()');
    click_on ('Login to ' + domain)
    Timeout.timeout(Capybara.default_wait_time) do
      loop until page.evaluate_script('jQuery.active').zero?
    end
  end

  # Click he logout link on the current page then wait for the
  # redirect to complete by looking for the user_email element
  def logout()
    click_link("logout_link")
    page.find('#user_email', :visible => true)
  end

end