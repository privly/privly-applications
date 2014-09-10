This threat model focuses on creating content and sharing links on host pages. For a complete picture of the system's threats, you should also see the [Plain Post Reading Threat Model](Plain Post Reading Threat Model).

## Application Name and Description
Privly is a browser-based application facilitating the injection of private content on any website. The client is loaded locally as a browser extension and plugin (available for Google Chrome and Mozilla Firefox) and communicates to a content server over HTTPS. Privly potentially supports many different cryptographic protocols. This document focuses on Privly's [Plain Post](Posts) [injectable application](Injectable-Applications). Other injectable applications have stronger security objectives.

## Authors
* Sean McGregor, Privly Lead Developer.  
*Contributors welcome!*

## Revision History
* Version 0.1DRAFT (**Current**): First draft.  

## Contents	

1. Security Objectives  
2. Application Overview  
3. Application Decomposition  
4. Threats  
5. Vulnerabilities

## 1. Security Objectives
The security objectives are:

* Limit content access to users authorized on a content server  
* Prevent the host page from accessing the content  
* Allow users to destroy, update, and share content after emailing or sharing it on the internet  

It is worth noting that our security objectives do *not* include:

* Anonymizing the connections and identities of users.  
* Protecting against key-loggers and other similar malware and backdoors on the client's machine.  
* Protecting against key-loggers and other similar malware and backdoors on the content servers.  
* Providing transport level security beyond using HTTPS.  
* Protect against message forgery.  
* Specifying the method used for authentication or authorization on the content server.  

## 2. Application Overview

**Posting New Content**

This process is for generating a new Privly-type link directly from the extension.

1. (a) The user initiates the posting process and types content into the injectable application.
1. (b) The injectable application sends the cleartext to the content server.
1. (c) The content server returns the content URL to the injectable application.
1. (d) The injectable application passes the content URL onto the extension.
1. (e) The extension places the content URL into the host page.

<pre>
 ____________                       ____________________________________________
|            |                      |                                          |
|  Host Page |                      |                Extension                 |
|            |  &lt;---Content URL---&lt; |                                          |
|____________|                      |__________________________________________|
                                                         ^                      
                                                    Content URL                 
                                                         |                      
 ____________                       _____________________|______________________
|            |                      |                                          |
|   User     |  >--User Content---> |              Injectable App              |
|            |                      |                                          |
|____________|                      |__________________________________________|
                                            |                       /\          
                                        Cleartext               Content URL     
                                            \/                       |          
                                    ___________________________________________ 
                                    |                                          |
                                    |              Content Server              |
                                    |                                          |
                                    |__________________________________________|
</pre>


#### Scenarios:

**Extension scenarios are**:  

* Receiving Content URLs from Injectable Application  
* Posting Content URLs to host pages  

**Injectable Application Scenarios are**  

* Accept user input for new content  
* Sending cleartext to content servers  
* Receiving Content URLs from Content Server  

**Content Server scenarios are**

* Authenticate identity of person using the injectable application  
* Accept content from injectable application  
* Send content URL to Injectable Application  

**Host Page Scenarios are**

* Accept the content URL from the extension

#### Technologies:
* **Extension**: JavaScript, HTML, CSS.  
* **Injectable App**: JavaScript, HTML, CSS, [jQuery](http://jquery.com).
* **Content Server**: Any server capable of serving files over SSL.
* **Host Page**: Any web standard application.

#### Application Security Mechanisms:
The most important application security mechanisms known at this time are:  

* Giving the host page a link to the content instead of the content itself  

## 3. Application Decomposition
This section describes the trust boundaries, entry points, exit points, and data flows.  

#### Trust Boundaries:
* The content server trusts user content authenticated via session cookies.
* The injectable application trusts the content URL given by the content server over SSL.
* The extension trusts the content URL given by the injectable application.
* The host page trusts the content URL given by the extension's script.

#### Server Entry and Exit Point:
* Port 443 for HTTPS.  

#### Data Flows:
* User login. Users login to a content server using any form of authentication supported by the content server. The user then has an authentication cookie tied to the content server's domain and all requests can be authenticated from the injectable applications.
* Typing content. Users type their content directly into the injectable application. User's trust the identity and security of the application because it is served locally from the extension and is not tied to a remote domain.
* Posting content to the content server. When the user submits the injectable application, the content is transmitted to the content server over SSL.
* Returning the content URL. The content server returns the URL for the content to the injectable application over SSL. The content url conforms to the [URL Specification](http://github.com/privly/privly-organization/wiki/URL-Specification), but additional parameters and tokens may be added depending on the authorization requirements for the content. Generally a content server will want to add a content access token to the URL so old links to the same content can easily be expired.

## 4. Threats
In the application overview, points `a`, `b`, `c`, `d`, and `e` delineate possible points of attack.  

Attacks will be judged according to the **DREAD** model:

* **Damage**: How big would the damage be if the attack succeeded?  
* **Reproducibility**: How easy is it to reproduce an attack?  
* **Exploitability**: How much time, effort, and expertise is needed to exploit the threat?  
* **Affected Users**: If a threat were exploited, what percentage of users would be affected?  
* **Discoverability**: How easy is it for an attacker to discover this threat?  

Each category has a minimum score of 0 and a maximum score of 10. The final DREAD score is the average of the category scores: `(D + R + E + A + D) / 5`.  

### Attack point A (User -> Injectable Application):
#### Phishing Web Application Posing as Trusted Injectable Application  
**Threat Description**: Users with little technical knowledge may be fooled by a phishing website or plugin posing as a legitimate Privly injectable application.

* **Damage**: A user could be compelled to use the phishing application to post their private content. **Score: 10**  
* **Reproducibility**: Users with little technical expertise may be susceptible if they visit a website that mimics the behavior of a legitimate Privly extension. **Score: 6**  
* **Exploitability**: Exploitability depends on the user. The extensibility of the system provides avenues for providing users with false yet plausible information about "advances" in the system. This threat can be mitigated by effective user education and communication. **Score: 7**  
* **Affected Users**: Users are affected individually; however, information they reveal to the phishing website may endanger others. **Score: 5**  
* **Discoverability**: It's unknown how the notion of discoverability may be measured for this threat. **Score: N/A**  

#### DREAD Score: 7.0  

***

#### Privly Malicious Client Code Delivery  
**Threat Description**: The user could be made to download a malicious version of the Privly Client instead of the legitimate version. The malicious version could contain backdoors.

* **Damage**: A compromised client could lead to the compromise of all posts sent by the user, and allow for further monitoring of the user's behavior. **Score: 10**  
* **Reproducibility**: Due to Chrome's use of SSL with HSTS and certificate pinning, reproducing this on Chrome is unlikely. Under Firefox, integrity checks are also very feasible. **Score: 3**  
* **Exploitability**: A highly considerable amount of time, effort and expertise is required for this threat to be pulled off remotely. **Score: 3**  
* **Affected Users**: Depending on the malicious actor, a single user could be targeted (if the actor is a hacker connected to a LAN) or an entire nation (if the hacker is an ISP being controlled by a malicious government.) **Score: 5**  
* **Discoverability**: In the majority of cases, this threat requires extensive testing of the SSL and code delivery infrastructure. **Score: 3**  

#### DREAD Score: 4.8  

***

### Attack Point B (Injectable Application -> Content Server):

#### SSL Man-in-the-Middle
**Threat Description**: The content server's SSL certificate, used for authentication, could be man-in-the-middled via a Certificate Authority compromise or other means.

* **Damage**: The attacker would be able to intercept, read and modify the stream of encrypted communications sent to and from the client. **Score: 10**  
* **Reproducibility**: Measures such as HSTS, responsible CA delegation and certificate pinning in browsers make this threat difficult to reproduce. **Score: 3**  
* **Exploitability**: A highly considerable amount of time, effort and expertise is required for this threat to be pulled off remotely. **Score: 3**  
* **Affected Users**: Depending on the malicious actor, a single user could be targeted (if the actor is a hacker connected to a LAN) or an entire nation (if the hacker is an ISP being controlled by a malicious government.) **Score: 5**  
* **Discoverability**: Depending on the Certificate Authority's operational security, the ability to control the Certificate Authority to forge certificates may be extremely easy to very difficult. Cases such as DigiNotar and even VeriSign have made this a real threat, however, even with trusted Certificate Authorities. **Score: 6**

#### DREAD Score: 5.4  

***

#### Content Server Compromise
**Threat Description**: The content server storing the cleartext is compromised by a third party.

* **Damage**: The attacker could copy, destroy, or modify all the user's posts. If the user continues to use the content server connection information could also be compromised **Score: 10**  
* **Reproducibility**: The possibility of a full remote compromise of a content server is unknown and ambiguous. **Score: 5**  
* **Exploitability**: Breaking into a server requires significant knowledge and skill, including obtaining a security hole either in the server's software (SSHD, HTTPD, etc.) or in the human security factors governing the server. **Score: 3**  
* **Affected Users**: Everyone connecting to the content server is under the realm of being possibly affected. **Score: 9**  
* **Discoverability**: Threat requires extensive penetration testing in order to discover if it *potentially* exists. **Score: 2**  

#### DREAD Score: 5.8

***

### Attack Point C (Content Server -> Injectable Application):

Same as Point (B).

***

### Attack Point D (Injectable Application -> Extension):

No known threats when the application is packaged with the extension.

***

### Attack Point E (Extension -> Host Page):

#### Host Page Refusal
**Threat Description**: The host page refuses the link.

* **Damage**: The user is not able to use the site or service with Privly. **Score: 2**  
* **Reproducibility**: Any web application could add form validation Javascript that would reject certain host domains. **Score: 8**  
* **Exploitability**: Host sites are more concerned with keeping users on their web site than they are about owning all the content shown on their websites. A site is more likely to not accept any user submitted hyperlinks than it is to selectively refuse hyperlinks. Many moderation platforms will automatically flag domains based on user behavior as being SPAM. Tying the content server to a particular domain is more likely to result in page refusal. **Score: 3**  
* **Affected Users**: Everyone posting Privly-type content to the refusing host page is affected. **Score: 5**  
* **Discoverability**: Discoverability for this threat is ill defined. **Score: N/A**

#### DREAD Score: 4.5

***

#### Host Page Server Compromise
**Threat Description**: The host page receiving the content (usually a social network or an email), could be compromised so an adversary would have access to all the links posted by the user.

* **Damage**: If the content server uses the link for authorization, then the content could be compromised. **Score: 4**  
* **Reproducibility**: The possibility of a full remote compromise of a host page is unknown and ambiguous. **Score: 5**  
* **Exploitability**: Breaking into a server requires significant knowledge and skill, including obtaining a security hole either in the server's software (SSHD, HTTPD, etc.) or in the human security factors governing the server. **Score: 3**  
* **Affected Users**: Everyone posting content to the host page could possibly be affected, but users do not post to all host sites so fewer users are affected than the content server being compromised. **Score: 4**  
* **Discoverability**: Threat requires extensive penetration testing in order to discover if it *potentially* exists. **Score: 2**  

#### DREAD Score: 3.6

***

### See Also

[Plain Posts Reading Threat Model](Plain Posts Reading Threat Model)

## 5. Vulnerabilities
*No vulnerabilities have been formally identified. Please contribute to this section!*

## Credit

Adapted from [Cryptocat's Threat Model](https://github.com/cryptocat/cryptocat/wiki/Threat-Model)
