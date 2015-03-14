#
# Runs each of the test sets defined below.
#
echo "This script steps through a series of test sets that run via Karma."
echo "Karma is a testing framework that will launch browsers and monitor files to re-run tests every time an edit is saved"
echo "!!!!!!"
echo "This will run all the tests currently defined in run_each.sh"
echo "You can also have tests run every time you save a file by defining the scripts you want to test with:"
echo "export FILES_TO_TEST=YOUR_FILES_HERE"
echo "Then you can issue 'karma start'"
echo "!!!!!!"

# Default to running the tests locally
# If you want to run on Continuous Integration
# then you can pass "karma.conf-ci.js" as the first positional argument.
KARMA="karma.conf.js"
if [ ! -z "$1" ]
then
  KARMA=$1
fi

# We need to report back a non-zero number if any of the tests failed
declare -i ISFAIL=0

runTest () {
  echo ""
  echo "running tests on shared libraries and $1"
  echo ""
  export FILES_TO_TEST=$1 && karma start $KARMA --single-run
  ISFAIL=$(($ISFAIL|$?))
}

# Each line below executes the scripts in order in the context of the browsers.
runTest 'Help/test/*.js,Help/js/*.js'
runTest 'History/js/*.js,History/test/*.js'
runTest 'Login/js/*.js,Login/test/*.js'
runTest 'Pages/js/options.js,Pages/js/tests/*.js'
runTest 'shared/javascripts/privly-web/new.js,PlainPost/js/new.js,PlainPost/test/new.js'
runTest 'shared/javascripts/privly-web/show.js,PlainPost/js/show.js,PlainPost/test/show.js'
runTest 'shared/javascripts/privly-web/new.js,Message/js/base64.js,Message/js/rawdeflate.js,Message/js/rawinflate.js,Message/js/zerobin.js,Message/js/new.js,Message/test/new.js,Message/test/zerobin.js'
runTest 'shared/javascripts/privly-web/show.js,Message/js/base64.js,Message/js/rawdeflate.js,Message/js/rawinflate.js,Message/js/zerobin.js,Message/js/show.js,Message/test/show.js,Message/test/zerobin.js'

if [ ! $ISFAIL -eq 0 ]
then
  echo "You have some work to do: tests are failing"
  exit 1
fi

exit 0
