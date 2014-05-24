This is an in-development Privly application whose purpose is to add image
sharing capabilities on top of the ZeroBin style of content sharing.

You can read a blog post about this application [here](https://www.privly.org/content/new-experimental-application-splitimage).

Before this application is production ready it needs some work:

* It uses the drag and drop API for selecting files, but it should
also display the traditional form-based files selection dialog.
* Test the application on more platforms from the hosted context.
* Develop a threat model and add it to this repo.
* Don't permit users to update the post in the injected context.
