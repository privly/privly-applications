# Status and Overview

The Message application was previously known as the ZeroBin app.  We are still using a fork of the [Zerobin project](http://sebsauvage.net/wiki/doku.php?id=php:zerobin) in the app. We renamed "ZeroBin" to "Message" since it is significantly less confusing to users.

ZeroBin encrypts the content in the browser using Javascript before sending it to the remote server for storage. The decryption key is then added to the anchor of the URL before it is inserted into the host page. The anchor is never shared with the remote server, so it is never able to read the decrypted text. In order to read the content, users must have both the link, and the ciphertext.

We modified the ZeroBin application to work with the Privly [URL Specification](http://github.com/privly/privly-organization/wiki/URL-Specification). It now places the ciphertext URL onto the anchor with the decryption key. This change removed ZeroBin's dependence on server rendering.

For more information, read [the original documentation of ZeroBin](http://sebsauvage.net/wiki/doku.php?id=php:zerobin)

***

## URL Format

For more details on the URL format, see the [URL Specification](http://github.com/privly/privly-organization/wiki/URL-Specification).

### Identifiers

These strings assign the `privlyInjectableApplication` parameter with the name of the referenced injectable application.

* ZeroBin

### Anchor Parameters

These parameters cannot be placed on the parameter string since that would result in their being transmitted to the remote server.

* privlyLinkKey: This key is used to decrypt the ciphertext. It may also be placed in the server parameters, but doing so is discouraged since it provides the parameter to the remote server.

### Anchor and Server Parameters

These parameters can be on either the parameter string or the hash text.

* privlyDataURL: The injected web application fetches the ciphertext from this URL. When the application is injected by an extension, the content found at this URL will be messaged to this application from the extension.
* (deprecated) privlyCiphertextURL: This is the former name of the privlyDataURL.

### Extension Parameters

These parameters are added by the extension.

* privlyOriginalURL: This parameter gives the original URL of the application. Privly-type extensions often have to change the source URL to point to local storage on the extension, but the extension still needs to provide the original parameters to the application. This parameter is only used internally in the extensions.

***

## Which Systems Have Access to What

 We list which components have access to particular pieces of information below:

* Content Server (Privly or similar party)
 * Ciphertext
* Host Page
 * Link Key
* [Injectable Application](Injectable Applications) - Posting
 * Cleartext
 * Link Key
 * Ciphertext
* [Injectable Application](Injectable Applications) - Reading, non-permissioned
 * Link Key
* [Injectable Application](Injectable Applications) - Reading, permissioned
 * Cleartext
 * Ciphertext
 * Link Key
* Extension
 * Cleartext
 * Ciphertext
 * Link Key
* Encryption Library
 * Nothing

***

## Posting Process (Encryption)

This is the high level process for posting content by the content server.

1. (User Action) The user types the content into the [Posting Application](http://github.com/privly/privly-organization/wiki/Posting-Application), selects which identities they want to share with, and submits the form.
1. The application generates a new symmetric key in Javascript, and encrypts the content with the key in Javascript.
1. The application sends the encrypted content to the remote server.
1. The content server then returns a URL for the content, to which the application adds the key in the anchortext before placing the link into the host page

### Cryptography API Function Calls

* None

### HTTPS Requests

The following network requests will be made by the application:

* Get user sharing lists and CSRF token
* Post Ciphertext and sharing list

***

## Viewing Process (Decryption)

This is the high level process for decrypting content by users who have permission to view the content.

1. Request the ciphertext
1. Decrypt the content with the link key attached to the anchor of the URL

### Cryptography API Function Calls

* None
 
### HTTPS Requests

The following network requests will be made by the application:

* Get Content
