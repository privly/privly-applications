# Put the spec you always want to run here
require_relative "tc_new"
require_relative "tc_show"
require_relative "tc_show_injected"
require_relative "tc_extension_options"
require_relative "tc_history"
# Don't run the posting process tests on Chrome as the
# posting process has changed.
if @browser == "firefox" || @browser == "safari"
  require_relative "tc_posting_process"
end
require_relative "tc_message"
