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
# "new" applications and "show" applications by adding them
# to the packages list below. If you add to the packages
# list you should define PACKAGE_NAME/new.html.subtemplate
# or PACKAGE_NAME/show.html.subtemplate to the corresponding
# PACKAGE_NAME directory. For an example subtemplate,
# look inside the PlainPost directory

from jinja2 import Environment, FileSystemLoader
from bs4 import BeautifulSoup as bs
import re

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

  # Templates are all referenced relative to the current
  # working directory
  env = Environment(loader=FileSystemLoader('.'))

  # List the packages. They are grouped by different types:
  # nav: These packages are included in the top level
  #      navigation.
  # new: These packages generate new privly-type links
  # show: These packages show existing privly-type content
  packages = {
  
    # Nav packages are specialized applications that may be rendered into the top
    # level navigation of the packages.
    "nav": ["Index", "Login"],
    
    # New packages are apps that can generate new Privly-type links.
    "new": ["ZeroBin", "PlainPost"],
    
    # Show packages are apps that can be injected into a host page.
    "show": ["ZeroBin", "PlainPost"]
  }
  
  for package_type in packages:
    for package in packages[package_type]:
      file_string = package_type
      
      # The navigational pages render the new.html template
      if file_string == "nav":
        file_string = "new"
        
      outfile_path = package + "/" + file_string + ".html"
      subtemplate_path = package + "/" + file_string + ".html.subtemplate"
      subtemplate_dict = {"packages": packages, "name": package, 
        "action": package_type}
      render(outfile_path, subtemplate_path, subtemplate_dict)
  
  render("Help/new.html", "Help/new.html.subtemplate", {"packages": packages, 
        "name": "Help", 
        "action": "new"})
