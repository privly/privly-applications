# Put the spec you always want to run here
require_relative "tc_new"
require_relative "tc_history"
# Run these tests only if the extension is installed
if @@privly_extension_active
  require_relative "tc_show"
  require_relative "tc_show_injected"
  require_relative "tc_extension_options"
  require_relative "tc_message"
  # Don't run the posting process tests on Chrome as the
  # posting process has changed.
  if @browser == "firefox"
    require_relative "tc_posting_process"
  end
end
