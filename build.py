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
#
# sudo easy_install beautifulsoup4 jinja2
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

# Templates are all referenced relative to the current
# working directory
env = Environment(loader=FileSystemLoader('.'))

# List the packages. They are grouped by different types:
# nav: These packages are included in the top level
#      navigation.
# new: These packages generate new privly-type links
# show: These packages show existing privly-type content
packages = {
  "nav": ["Index"],
  "new": ["ZeroBin", "PlainPost"],
  "show": ["ZeroBin", "PlainPost"]
}

# New packages are apps that can generate new Privly-type links.
for news in packages["new"]:
  f = open(news + "/new.html", 'w')
  subtemplate = env.get_template(news + "/new.html.subtemplate")
  html = subtemplate.render({"packages": packages, "name": news})
  prettyHTML = make_readable(html)
  f.write(prettyHTML)
  f.close()

# Show packages are apps that can be injected into a host page.
for shows in packages["show"]:
  f = open(shows + "/show.html", 'w')
  subtemplate = env.get_template(shows + "/show.html.subtemplate")
  html = subtemplate.render({"packages": packages, "name": shows})
  prettyHTML = make_readable(html)
  f.write(prettyHTML)
  f.close()

# Nav packages are specialized applications that may be rendered into the top
# level navigation of the packages.
for navs in packages["nav"]:
  f = open(navs + "/new.html", 'w')
  subtemplate = env.get_template(navs + "/new.html.subtemplate")
  html = subtemplate.render({"packages": packages, "name": navs})
  prettyHTML = make_readable(html)
  f.write(prettyHTML)
  f.close()