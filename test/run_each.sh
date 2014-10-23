#
# Runs each of the test sets defined below.
# This script depends on the karma.conf.js file which defines many of the
# options of the test.
#
echo "This script steps through a series of test sets that run via Karma."
echo "Karma is a testing framework that will launch browsers and monitor files to re-run tests every time an edit is saved"
echo "!!!!!!"
echo "This will run all the tests currently defined in run_each.sh"
echo "You can also have tests run every time you save a file by defining the scripts you want to test with:"
echo "export FILES_TO_TEST=YOUR_FILES_HERE"
echo "Then you can issue 'karma start'"
echo "!!!!!!"

declare -i ISFAIL=0

runTest () {
  echo ""
  echo "running tests on shared libraries and $1"
  echo ""
  export FILES_TO_TEST=$1 && karma start --single-run
  ISFAIL=$(($ISFAIL|$?))
}

# Each line below executes the scripts in order in the context of the browsers.
runTest 'Help/test/*.js,Help/js/*.js'
runTest 'History/js/*.js,History/test/*.js'
runTest 'Login/js/*.js,Login/test/*.js'
runTest 'Pages/js/options.js,Pages/js/tests/*.js'
runTest 'shared/javascripts/privly-web/new.js,PlainPost/js/new.js,PlainPost/test/new.js'
runTest 'shared/javascripts/privly-web/show.js,PlainPost/js/show.js,PlainPost/test/show.js'
runTest 'shared/javascripts/privly-web/new.js,ZeroBin/js/base64.js,ZeroBin/js/rawdeflate.js,ZeroBin/js/rawinflate.js,ZeroBin/js/zerobin.js,ZeroBin/js/new.js,ZeroBin/test/new.js,ZeroBin/test/zerobin.js'
runTest 'shared/javascripts/privly-web/show.js,ZeroBin/js/base64.js,ZeroBin/js/rawdeflate.js,ZeroBin/js/rawinflate.js,ZeroBin/js/zerobin.js,ZeroBin/js/show.js,ZeroBin/test/show.js,ZeroBin/test/zerobin.js'

runTest

if [ ! $ISFAIL -eq 0 ]
then
  echo "You have some work to do: tests are failing"
  exit -1
fi

exit 0
