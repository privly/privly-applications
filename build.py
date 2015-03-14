# This python script builds Privly applications so they
# can share a common user interface and (eventually)
# support localization. If you are building
# a new application, you will probably want to copy
# an existing application folder, e.g. PlainPost,
# to a new directory and work there. When you are
# wanting to ship the application, we will work to
# integrate it with this build system.
#
# This build script looks for applications to build
# by looking at all the subfolders for manifest.json
# files. These files are expected to have the following format
#
# [
#  {
#    "release_status": "alpha", // Required values: redirect, experimental, deprecated, alpha, beta, release
#    "platforms": ["chrome"], // Optional values: web, chrome, firefox
#    "subtemplate_path": "Pages/ChromeFirstRun.html.subtemplate", // Required path to the subtemplate
#    "outfile_path": "Pages/ChromeFirstRun.html", // Required path the othe output file
#    "subtemplate_dict": {"name": "FirstRun", "action": "nav"} // Template dictionary values
#  },
#  {...}
# ]
#
# Prerequisites for running this script include
# html5lib, BeautifulSoup and Jinja2. You can install
# them both with:
#
# `pip install -r requirements.txt`
#
# This assumes you have python-pip installed:
# `sudo apt-get install python-pip`
#
# Alternatively, these can be installed using `easy_install`:
#
# `sudo easy_install html5lib beautifulsoup4 jinja2`
#
# This assumes you have python-setuptools:
# `sudo apt-get install python-setuptools`
#
# This script uses the jinja2 templating system. For
# information on Jinja2, see:
# http://jinja.pocoo.org/docs/
#
# We prefer readability over minified apps. BeautifulSoup
# properly formats the HTML so it is nested and readable.
# http://www.crummy.com/software/BeautifulSoup/bs4/doc/#installing-beautiful-soup
#
# You can run the script from the privly-applications directory:
# `python build.py`

from jinja2 import Environment, FileSystemLoader
from bs4 import BeautifulSoup as bs
import os
import json
import re
import argparse # Parsing arguments

def make_readable(html):
  """
  Make the rendered HTML formatting readable
  @param {string} html The HTML that we need to make readable.
  """
  soup = bs(html, "html5lib")
  prettyHTML = soup.prettify().encode("utf8")
  
  # Beautiful soup breaks textarea formatting
  # since it adds extra whitespace. If you use "pre"
  # tags, you should be warry of the same problem
  return re.sub(r'[\ \n]{2,}</textarea>',
               "</textarea>",
               prettyHTML)

def render(outfile_path, subtemplate_path, subtemplate_dict):
  """
  Render the templates to html.
  @param {string} outfile The relative path to the file which we are rendering
    to.
  @param {string} subtemplate_path The relative path to the file of the subtemplate
    to be rendered.
  @param {dictionary} subtemplate_dict The variables required by the subtemplate.
  """
  f = open(outfile_path, 'w')
  subtemplate = env.get_template(subtemplate_path)
  html = subtemplate.render(subtemplate_dict)
  prettyHTML = make_readable(html)
  f.write(prettyHTML)
  f.close()

def is_build_target(template):
  """
  Determines whether the build target is currently active.
  @param {dictionary} template The dictionary of the object to build.
  """

  is_targeted_platform = "platforms" not in template or\
    args.platform in template["platforms"]
  is_targeted_release_type = release_titles.index(args.release) <=\
    release_titles.index(template["release_status"])

  return is_targeted_platform and is_targeted_release_type

def get_link_creation_apps():
  """
  Gets a list of the apps that will be included in the top navigation
  for generating new links
  """
  creation_apps = []
  for dirname, dirnames, filenames in os.walk('.'):
    if "manifest.json" in filenames:
      f = open(dirname + "/manifest.json", 'r')
      template_list = json.load(f)
      f.close()
      for template in template_list:
        if is_build_target(template):
          if "nav" in template.keys() and template["nav"] == "new":
            creation_apps.append(template["subtemplate_dict"]["name"])

  # Hack to maintain current app order
  creation_apps.sort()
  return creation_apps

release_titles = ["redirect", "experimental", "deprecated", "alpha", "beta", "release"]

if __name__ == "__main__":
  
  # Change the current working directory to the directory of the build script
  abspath = os.path.abspath(__file__)
  dname = os.path.dirname(abspath)
  os.chdir(dname)

  # Parse Arguments
  # Specify the potential build targets
  platforms = ['web', 'chrome', 'firefox']
  parser = argparse.ArgumentParser(description='Declare platform build target.')
  parser.add_argument('-p', '--platform', metavar='p', type=str,
                     help='The platform you are building for',
                     required=False,
                     default='web',
                     choices=platforms)
  parser.add_argument('-r', '--release', metavar='r', type=str,
                     help="""Which apps to include in the navigation:
                             experimental, deprecated, alpha, beta, release
                             building 'experimental' will build all apps,
                             whereas 'release' will only build apps marked
                             for release""",
                     required=False,
                     default='deprecated',
                     choices=release_titles)
  args = parser.parse_args()
  
  # Templates are all referenced relative to the current
  # working directory
  env = Environment(loader=FileSystemLoader('.'))
  
  # Listing of other apps so they can be added to the common nav
  packages = {"new": get_link_creation_apps()}
  
  print("################################################")
  print("Targeting the *{0}* platform".format(args.platform))
  print("To build for another platform, add the option --platform=NAME_HERE")
  print("Current platform options include {0}".format(platforms))
  print("################################################")

  # Build the templates.
  print("Building...")

  # Find all the manifest files
  for dirname, dirnames, filenames in os.walk('.'):
    if "manifest.json" in filenames:
      f = open(dirname + "/manifest.json", 'r')
      template_list = json.load(f)
      f.close()

      for template in template_list:

        # Don't build the app if a platform is specified and it is not the
        # currently targeted platform
        if not is_build_target(template):
          continue

        template["subtemplate_dict"].update({"args": args, "packages": packages})
        print("{0}'s {1} action to {2}".format(
          template["subtemplate_dict"]["name"],
          template["subtemplate_dict"]["action"],
          template["outfile_path"]))
        render(template["outfile_path"], template["subtemplate_path"],
               template["subtemplate_dict"])

print("################################################")
print("Build complete.  You can now view the generated applications in their folders.")
