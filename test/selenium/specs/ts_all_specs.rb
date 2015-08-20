# Put the spec you always want to run here
require_relative "tc_new"
require_relative "tc_history"

# Run these tests only if the extension is installed
if @@privly_extension_active
  require_relative "tc_show"
  require_relative "tc_show_injected"
  require_relative "tc_extension_options"
  require_relative "tc_message"
  
  # There are different posting process tests for Chrome and Firefox
  # since the changes in Chrome have not been introduced to Firefox yet
  if @browser == "firefox"
    require_relative "tc_posting_process"
  else
    require_relative "tc_privly_button"
    require_relative "tc_seamless_posting_forward"
  end
end
