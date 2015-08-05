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
echo "Currently, the tests are run only in the Firefox browser"
echo "To test on different browsers, you can do:"
echo "export BROWSERS_TO_TEST=Chrome,Firefox,Safari"
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
  echo "running tests on $1"
  echo ""
  export FILES_TO_TEST=$1

  # By default, run tests on the Firefox browser
  # If the BROWSERS_TO_TEST environment variable is set,
  # run the tests on the specified browsers
  if [ "$BROWSERS_TO_TEST" == "" ]
  then
    karma start $KARMA --single-run
  else

    # Since the `--browsers` option will circumvent the custom launchers
    # of the CI we need to specify it a different way
    if [ "$KARMA" == "karma.conf-ci.js" ]
    then
      karma start $KARMA --single-run --sauce-browsers="$BROWSERS_TO_TEST"
    else
      karma start $KARMA --single-run --browsers "$BROWSERS_TO_TEST"
    fi
  fi
  ISFAIL=$(($ISFAIL|$?))
}

# These are the scripts that will be loaded for every test
commonScripts="vendor/jquery.min.js,vendor/*.js,vendor/datatables/jquery.dataTables.min.js,vendor/datatables/dataTables.bootstrap.min.js,vendor/bootstrap/js/*.js,shared/javascripts/*.js,shared/test/*.js"

# Each line below executes the scripts in order in the context of the browsers.
runTest "$commonScripts,Help/js/*.js,Help/test/*.js"
runTest "$commonScripts,History/js/*.js,History/test/*.js"
runTest "$commonScripts,Login/js/*.js,Login/test/*.js"
runTest "$commonScripts,Pages/js/options.js,Pages/js/tests/*.js"
# test app view adapters
runTest "$commonScripts,shared/javascripts/viewAdapters/new.js,shared/test/viewAdapters/new.js"
runTest "$commonScripts,shared/javascripts/viewAdapters/show.js,shared/test/viewAdapters/show.js"
runTest "$commonScripts,shared/javascripts/viewAdapters/seamless.js,PlainPost/js/plainpostModel.js,shared/test/viewAdapters/seamless.js"
runTest "$commonScripts,shared/javascripts/viewAdapters/seamless_ttlselect.js,shared/test/viewAdapters/seamless_ttlselect.js"
# test app models
runTest "$commonScripts,PlainPost/js/plainpostModel.js,PlainPost/test/plainpostModel.js"
runTest "$commonScripts,Message/js/vendor/base64.js,Message/js/vendor/rawdeflate.js,Message/js/vendor/rawinflate.js,Message/js/vendor/zerobin.js,Message/test/zerobin.js,Message/js/messageModel.js,Message/test/messageModel.js"

if [ ! $ISFAIL -eq 0 ]
then
  echo "You have some work to do: tests are failing"
  exit 1
fi

exit 0
