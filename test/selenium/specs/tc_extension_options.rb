# This test class tests whether the extensions options change
# after they are selected on the options page.
class TestOptions < Test::Unit::TestCase

  include Capybara::DSL # Provides for Webdriving

  def setup
    @options_url = @@privly_applications_folder_path + "/Pages/ChromeOptions.html"
    page.driver.browser.get(@options_url)
  end

=begin
  # This test is broken, because we have switched to canvas
  # FIX ME

  def test_regenerating_glyph
    current_fill = page.all(:css, '.glyph_fill').length
    # todo, make this elegant
    10.times do
      click_button('regenerate_glyph')
      if not current_fill == page.all(:css, '.glyph_fill').length
       return
      end
    end
    assert false # It probabilistically did not generate a new Glyph
  end
=end

  def test_update_whitelist
    # Assert nothing is injected before whitelisting
    page.driver.browser.get("http://test.privly.org/test_pages/nonwhitelist.html")
    assert page.has_no_xpath?('//iframe')

    # Update the whitelist
    page.driver.browser.get(@options_url)
    elements = page.all(:css, '.whitelist_url')
    elements[0].set 'Dev.Privly.Org.phish.org'
    page.driver.browser.get("http://test.privly.org/test_pages/nonwhitelist.html")
    assert page.has_xpath?('//iframe')

    # Assert something injected
    page.driver.browser.get("http://test.privly.org/test_pages/nonwhitelist.html")
    assert page.has_xpath?('//iframe')
  end

  def test_changing_content_server
    page.driver.browser.get(@options_url)

    page.select 'https://dev.privly.org', :from => 'content_server_url'
    click_button('save_server')
    page.driver.browser.get(@options_url)
    assert page.has_content?('dev.privly.org')
    page.select 'https://privlyalpha.org (recommended)', :from => 'content_server_url'
    click_button('save_server')
  end

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

end
