# Status and Overview

Status: **Under development**  
Plain Posts are the [injectable application](http://github.com/privly/privly-organization/wiki/Injectable-Applications) endpoint developed for the Proof-of-Concept of Privly. Plain Posts do not implement any content cryptography. The current effort for plain posts is to refactor it into an application we can eventually serve directly from the extension.

Plain Posts were developed as a Ruby on Rails application. We need to refactor:

* Package all the templates and scripts together into a static application (no templating) and make it indifferent to where the content is stored
* Render the posted Markdown on the client

***

## URL Format

For more details on the URL format, see the [URL Specification](http://github.com/privly/privly-organization/wiki/URL-Specification).

### Identifiers

These strings assign the `privlyInjectableApplication` parameter with the name of the referenced injectable application.

* PlainPost

### Anchor Parameters

The PlainPost injectable application does not have any parameters that the content server should not have access to. Consequently, there are no parameters exclusive to the anchor text.

### Anchor and Server Parameters

These parameters can be on either the parameter string or the hash text.

* privlyDataURL: The injected web application fetches the content from this URL. When the application is injected by an extension, the content found at this URL will be messaged to this application from the extension.

### Extension Parameters

These parameters are added by the extension.

* privlyOriginalURL: This parameter gives the original URL of the application. Privly-type extensions often have to change the source URL to point to local storage on the extension, but the extension still needs to provide the original parameters to the application. This parameter is only used internally in the extensions.

***

## Which Systems Have Access to What

 We list which components have access to particular pieces of information below:

* Content Server (Privly or similar party)
 * Cleartext
 * Link
* Host Page
 * Link
* [Injectable Application](http://github.com/privly/privly-organization/wiki/Injectable-Applications) - Posting
 * Cleartext
 * Link
* [Injectable Application](http://github.com/privly/privly-organization/wiki/Injectable-Applications) - Reading, non-permissioned
 * Link
* [Injectable Application](http://github.com/privly/privly-organization/wiki/Injectable-Applications) - Reading, permissioned
 * Cleartext
 * Link
* Extension
 * Cleartext
 * Link
* Encryption Library
 * Nothing

***

## Posting Process

This is the high level process for posting content by the content server.

1. (User Action) The user types the content into the [Posting Application](http://github.com/privly/privly-organization/wiki/Posting-Application), selects which identities they want to share with, and submits the form.
1. The content server then returns a URL for the content, which is placed into the host page

### Cryptography API Function Calls

* None

### HTTPS Requests

The following network requests will be made by the application:

* Get user sharing lists and CSRF token
* Post Content and sharing list

***

## Viewing Process

This is the high level process for decrypting content by users who have permission to view the content.

1. Request the content

### Cryptography API Function Calls

* None
 
### HTTPS Requests

The following network requests will be made by the application:

* Get Content
* Post an Update to Content