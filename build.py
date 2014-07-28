# This python script builds Privly applications so they
# can share a common user interface and (eventually)
# support localization. If you are building
# a new application, you will probably want to copy
# an existing application folder, e.g. PlainPost,
# to a new directory and work there. When you are
# wanting to ship the application, we will work to
# integrate it with this build system.
#
# Prerequisites for running this script include
# BeautifulSoup and Jinja2. You can install
# them both with:
# `sudo easy_install beautifulsoup4 jinja2`
#
# This assumes you have python-setuptools:
# `sudo apt-get install python-setuptools`
#
# This script uses the jinja2 templating system:
# http://jinja.pocoo.org/docs/
#
# We prefer readability over minified apps. BeautifulSoup
# properly formats the HTML so it is nested and readable.
# http://www.crummy.com/software/BeautifulSoup/bs4/doc/#installing-beautiful-soup
#
# You can run the script from the privly-applications directory:
# `python build.py`
#
# This templating system is a starting point, but is 
# not fully featured. You can currently add new
# applications by adding to the "to_build" object
# below.
#
# Note: if you are building for a platform that has platform
# specific code

from jinja2 import Environment, FileSystemLoader
from bs4 import BeautifulSoup as bs
import os
import re
import argparse # Parsing arguments

# Make the rendered HTML formatting readable
def make_readable(html):
  
  soup = bs(html)
  prettyHTML = soup.prettify().encode("utf8")
  
  # Beautiful soup breaks textarea formatting
  # since it adds extra whitespace. If you use "pre"
  # tags, you should be warry of the same problem
  return re.sub(r'[\ \n]{2,}</textarea>',
               "</textarea>",
               prettyHTML)

def render(outfile_path, subtemplate_path, subtemplate_dict):
  """
  @param outfile String. The relative path to the file which we are rendering
    to.
  @param subtemplate_path String. The relative path to the file of the subtemplate
    to be rendered.
  @param subtemplate_dict Dictionary. The variables required by the subtemplate.
  """
  f = open(outfile_path, 'w')
  subtemplate = env.get_template(subtemplate_path)
  html = subtemplate.render(subtemplate_dict)
  prettyHTML = make_readable(html)
  f.write(prettyHTML)
  f.close()

if __name__ == "__main__":
  
  # Change the current working directory to the directory of the build script
  abspath = os.path.abspath(__file__)
  dname = os.path.dirname(abspath)
  os.chdir(dname)

  # Parse Arguments
  parser = argparse.ArgumentParser(description='Declare platform.')
  parser.add_argument('-p', '--platform', metavar='p', type=str,
                     help='The platform you are building for',
                     required=False,
                     default='web')
  args = parser.parse_args()
  
  # Templates are all referenced relative to the current
  # working directory
  env = Environment(loader=FileSystemLoader('.'))
  
  # Quick hack to make apps aware of each other in the templating.
  packages = {"new": ["ZeroBin", "PlainPost"]}
  
  # The build list for applications is and array of objects:
  # {
  #   "subtemplate_path": The path to the subtemplate we are building.
  #   "outfile_path": The path to where we want to write the output file.
  #   "subtemplate_dict": The variables to pass into the subtemplate.
  # }
  #
  # Eventually it would be good to move this config into a manifest file
  # included in the directory.
  to_build = [
    {
      "subtemplate_path": "Index/new.html.subtemplate",
      "outfile_path": "Index/new.html",
      "subtemplate_dict": {"packages": packages, "name": "Index", 
        "action": "nav", "args": args}
    },
    {
      "subtemplate_path": "Login/new.html.subtemplate",
      "outfile_path": "Login/new.html",
      "subtemplate_dict": {"packages": packages, "name": "Login", 
        "action": "new", "args": args}
    },
    {
      "subtemplate_path": "PlainPost/new.html.subtemplate",
      "outfile_path": "PlainPost/new.html",
      "subtemplate_dict": {"packages": packages, "name": "PlainPost", 
        "action": "new", "args": args}
    },
    {
      "subtemplate_path": "PlainPost/show.html.subtemplate",
      "outfile_path": "PlainPost/show.html",
      "subtemplate_dict": {"packages": packages, "name": "PlainPost", 
        "action": "show", "args": args}
    },
    {
      "subtemplate_path": "ZeroBin/new.html.subtemplate",
      "outfile_path": "ZeroBin/new.html",
      "subtemplate_dict": {"packages": packages, "name": "ZeroBin", 
        "action": "new", "args": args}
    },
    {
      "subtemplate_path": "ZeroBin/show.html.subtemplate",
      "outfile_path": "ZeroBin/show.html",
      "subtemplate_dict": {"packages": packages, 
        "name": "ZeroBin", 
        "action": "show", "args": args}
    },
    {
      "subtemplate_path": "Help/new.html.subtemplate",
      "outfile_path": "Help/new.html",
      "subtemplate_dict": 
        {"packages": packages, 
         "name": "Help", 
         "action": "new", "args": args}
    },
  ]
  
  # Add the Chrome-specific applications if the apps were explicitly requested
  if args.platform == "chrome":
    to_build.append({
      "subtemplate_path": "Pages/ChromeFirstRun.html.subtemplate",
      "outfile_path": "Pages/ChromeFirstRun.html",
      "subtemplate_dict": {"packages": packages, "name": "FirstRun", 
        "action": "nav", "args": args}
    }
    )
    to_build.append(
    {
      "subtemplate_path": "Pages/ChromeOptions.html.subtemplate",
      "outfile_path": "Pages/ChromeOptions.html",
      "subtemplate_dict": {"packages": packages, "name": "Options", 
        "action": "nav", "args": args}
    })
  
  # Build the templates.
  for package in to_build:
    render(package["outfile_path"], package["subtemplate_path"], 
      package["subtemplate_dict"])
