This is a demonstration of the Privly Project's flexibility in displaying dynamic content. It uses the d3.js visualization library to render encrypted JSON graph data as found [here](http://bl.ocks.org/mbostock/4062045). This app is a demonstration and is only intended to be a starting point for making a true encrypted visualization application. Read more about [injectable applications](https://github.com/privly/privly-organization/wiki/Injectable-Applications).

# Creating Content

1. Content is dropped into the form of new.html following the format found [here](http://bl.ocks.org/mbostock/4062045).
1. The content is encrypted with a new randomly generated password.
1. The encrypted content is sent to a server for storage.
1. The server returns a URL to the content.
1. This application adds the decryption key to the hash text of the URL.
1. The URL can now be emailed, messaged, etc, and it will be "injected" when the viewer encounters it if they have the extension installed.

# Viewing Content

1. The application requests the content from the remote server.
1. The application decrypts the content with the key found on the URL.
1. The application renders the graph visualization.

------------------------------------------------------------------------------

ZeroBin 0.15 Alpha
=== THIS IS ALPHA SOFTWARE - USE AT YOUR OWN RISKS ====

ZeroBin is a minimalist, opensource online pastebin where the server 
has zero knowledge of pasted data. Data is encrypted/decrypted in the 
browser using 256 bits AES. 


# ZeroVis version history #

  * Committed initial experimental application.

