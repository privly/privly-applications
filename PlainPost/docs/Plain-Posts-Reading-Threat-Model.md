This threat model focuses on the threats to both the user reading the content, and the user who posted the original link. For a complete picture of the system's threats, you should also see the [Plain Post Posting Threat Model](Plain-Posts-Posting-Threat-Model.md).

## Application Name and Description
Privly is a browser-based application facilitating the injection of private content on any website. The client is loaded locally as a browser extension and plugin (available for Google Chrome and Mozilla Firefox) and communicates to a content server over HTTPS. Privly potentially supports many different cryptographic protocols. This document focuses on Privly's [Plain Post](Posts.md) [injectable application](https://github.com/privly/privly-organization/wiki/Injectable-Applications). Other injectable applications have stronger security objectives.

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

**Encountering Content**

This process is for injecting content directly into host pages.

1. (a) The extension injects a content script into the host page.
1. (b) The content script finds a Privly-type link and injects it into the host page.
1. (c) The injectable application requests the content from the content server.
1. (d) The content server returns the content to the injectable application.
1. (e) The injectable application tells the host page the height of the application's content.

<pre>

      ________________________ Inject Content Script ______________________       
     \/                                                                   |       
 ____________                     ___________                       ______|____   
|            |  >--Inject App --> |         |                      |           |  
|  Host Page |                    | Inj.App |                      | Extension |  
|            |  &lt;--iframe size--&lt; |         |                      |           |  
|____________|                    |_________|                      |___________|  
                                    |     /\                                      
                          Content Req.    Cleartext                              
                                   \/      |                                      
                                  ____________                                    
                                 |            |                                   
                                 |  Content   |                                   
                                 |  Server    |                                   
                                 |____________|                                   
</pre>

#### Scenarios:

**Extension scenarios are**:  

* Adding the content script to the host page (when the host page does not define it itself)

**Injectable Application Scenarios are**  

* Request content from content server  
* Display content within host pages  

**Content Server scenarios are**

* Authenticate identity of person using the injectable application  
* Authorize request for content  
* Transmit content to injectable application  

**Host Page Scenarios are**

* Inject the injectable application

#### Technologies:
* **Extension**: JavaScript, HTML, CSS.  
* **Injectable App**: JavaScript, HTML, CSS, [jQuery](http://jquery.com).
* **Content Server**: Any server capable of serving files over SSL.
* **Host Page**: Any web standard application.

#### Application Security Mechanisms:
The most important application security mechanisms known at this time are:  

* Injected applications have a source domain other than the host page, which triggers the [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy).   

## 3. Application Decomposition
This section describes the trust boundaries, entry points, exit points, and data flows.  

#### Trust Boundaries:
* The content server trusts user identity authenticated via session cookies.
* The injectable application trusts content delivered from the content server over SSL.
* The host page trusts the height of the content URL

#### Server Entry and Exit Point:
* Port 443 for HTTPS.  

#### Data Flows:
* User login. Users login to a content server using any form of authentication supported by the content server. The user then has an authentication cookie tied to the content server's domain and all requests can be authenticated from the injectable applications.
* Requesting content from the content server. The injectable application requests the content from the content server over SSL.
* iframe height. The same origin policy means the host page does not have access to the height of the injected application. The injected application messages this to the host page.

## 4. Threats
In the application overview, points `a`, `b`, `c`, `d`, and `e` delineate possible points of attack.  

Attacks will be judged according to the **DREAD** model:

* **Damage**: How big would the damage be if the attack succeeded?  
* **Reproducibility**: How easy is it to reproduce an attack?  
* **Exploitability**: How much time, effort, and expertise is needed to exploit the threat?  
* **Affected Users**: If a threat were exploited, what percentage of users would be affected?  
* **Discoverability**: How easy is it for an attacker to discover this threat?  

Each category has a minimum score of 0 and a maximum score of 10. The final DREAD score is the average of the category scores: `(D + R + E + A + D) / 5`.  

### Attack point A (Extension -> Host Page):
#### Phishing Web Application Posing as a natural part of the host page  
**Threat Description**: Users with little technical knowledge may be fooled by a phishing website or plugin posing as legitimate content of the host page.

* **Damage**: A user could be deceived into taking actions inconsistent with their own interests. **Score: 7**  
* **Reproducibility**: Users would have to change several default settings and run an unofficial injectable application in their [whitelist](https://github.com/privly/privly-organization/wiki/Whitelist). A tooltip labels Privly content as being injected into the web page. **Score: 1**  
* **Exploitability**: Exploitability depends on the user, not the effort of the adversary. This threat can be mitigated by effective user education and communication. **Score: 2**  
* **Affected Users**: Users are affected individually only if they change many default settings. **Score: 1**  
* **Discoverability**: Adversaries could place malicious links on a variety of high-traffic message boards to find users who could be targeted by this exploit. **Score: 7**  

#### DREAD Score: 3.6  

***

#### The Reading User Can Reshare the Link
**Threat Description**: Any user with access to the link could re-share the link to another host page.

* **Damage**: If the content server strips identifying metadata from the content then the damage is no worse than copying and pasting the content directly. The posting user maintains control over the content, so they could update or destroy it in the future. Subsequently adding privileged information to the linked content could compound the threat. **Score: 7**  
* **Reproducibility**: Anyone with access to the link will be able to copy and paste it elsewhere. **Score: 7**  
* **Exploitability**: The server can place authorization restrictions on the linked content independent of the link's location.  **Score: 2**  
* **Affected Users**: Any host page or user with access to the host page can re-share the link. **Score: 7**  
* **Discoverability**: Attacking a specific user requires access to a host page containing a privileged link. **Score: 6**

#### DREAD Score: 5.8  

***

#### Host Page User Spoofing
**Threat Description**: The host page can present content as injected Privly content. Note: future versions will eliminate this threat by adding a user secret glyph to the tooltip of the injected application.

* **Damage**: If the user believes the content came from the user and not the site, they may have a higher level of trust in the message and act inappropriately. **Score: 6**  
* **Reproducibility**: Knowledge of the posting user's life and communications is required to convince the reading user of origin of the communication. **Score: 3**  
* **Exploitability**: Most host pages would need to be compromised in order to exploit this threat. Users are unlikely to communicate with host pages prone to spoofing users. Users can click through to the content and view it on the content server's web application. **Score: 2**  
* **Affected Users**: Users connecting to malicious or compromised sites could be threatened by this. **Score: 5**  
* **Discoverability**: Discoverability is poorly defined for this threat. **Score: N/A**  

#### DREAD Score: 4.0  

***

#### Host Page Link Switching
**Threat Description**: The host page can present a URL from the content server other than the user posted content URL.

* **Damage**: If the host site has an account on the content server, then the content could potentially be anything the host page wants it to be. **Score: 8**  
* **Reproducibility**: Knowledge of the posting user's life and communications is required to convince the reading user of origin of the communication. **Score: 3**  
* **Exploitability**: Most host pages would need to be compromised in order to exploit this threat. Users are unlikely to communicate with host pages prone to spoofing users. **Score: 2**  
* **Affected Users**: Users connecting to malicious or compromised sites could be threatened by this threat. **Score: 5**  
* **Discoverability**: Discoverability is poorly defined for this threat. **Score: N/A**  

#### DREAD Score: 4.5

***

### Attack Point B (Host Page -> Injectable Application):

#### Host page knows the user's whitelisted domains
**Threat Description**: The host page will be able to detect the injection of iframes by monitoring the page's DOM in JavaScript.

* **Damage**: The host page will be able to build a list of the user's trusted servers. **Score: 3**  
* **Reproducibility**: The host page needs to deliver the user a list of domains. **Score: 10**  
* **Exploitability**: The user will need to visit a host page wanting to learn the user's trusted domains. **Score: 6**  
* **Affected Users**: Any user connecting to a malicious host page. **Score: 6**  
* **Discoverability**: The user will need to visit a host page wanting to learn the user's trusted domains. **Score: 6**

#### DREAD Score: 6.2

***

### Attack Point C (Injectable Application -> Content Server):

#### SSL Man-in-the-Middle
**Threat Description**: The content server's SSL certificate, used for authentication, could be man-in-the-middled via a Certificate Authority compromise or other means.

* **Damage**: The attacker would be able to intercept, read and modify the stream of encrypted communications sent to and from the client. **Score: 10**  
* **Reproducibility**: Measures such as HSTS, responsible CA delegation and certificate pinning in browsers make this threat difficult to reproduce. **Score: 3**  
* **Exploitability**: A highly considerable amount of time, effort and expertise is required for this threat to be pulled off remotely. **Score: 3**  
* **Affected Users**: Depending on the malicious actor, a single user could be targeted (if the actor is a hacker connected to a LAN) or an entire nation (if the hacker is an ISP being controlled by a malicious government.) **Score: 5**  
* **Discoverability**: Depending on the Certificate Authority's operational security, the ability to control the Certificate Authority to forge certificates may be extremely easy to very difficult. Cases such as DigiNotar and even VeriSign have made this a real threat, however, even with trusted Certificate Authorities. **Score: 6**

#### DREAD Score: 5.4  

***

#### Whitelisted content servers can track user requests
**Threat Description**: Links shared on specific host pages could be used to track the host pages viewed by a user if the link is automatically injected.

* **Damage**: Tracking damages user privacy by broadcasting their browsing habits, but it does not compromise their content. **Score: 3**  
* **Reproducibility**: If the content server is default [whitelisted](https://github.com/privly/privly-organization/wiki/Whitelist), then it could track all Privly users across all websites. **Score: 10**  
* **Exploitability**: All default whitelisted servers are required to not track their users. **Score: 2**  
* **Affected Users**: Individual users are affected only if they change default settings or a default whitelisted server is compromised. **Score: 2**  
* **Discoverability**: Content servers would need to distribute links on the sites the user visits. **Score: 3**  

#### DREAD Score: 4.0

***

#### Content Server Compromise
**Threat Description**: The content server storing the cleartext is compromised by a third party.

* **Damage**: The attacker could copy, destroy, or modify all the user's posts. If the user continues to use the content server connection information could also be compromised **Score: 8**  
* **Reproducibility**: The possibility of a full remote compromise of a content server is unknown and ambiguous. **Score: 5**  
* **Exploitability**: Breaking into a server requires significant knowledge and skill, including obtaining a security hole either in the server's software (SSHD, HTTPD, etc.) or in the human security factors governing the server. **Score: 3**  
* **Affected Users**: Everyone connecting to the content server is under the realm of being possibly affected. **Score: 9**  
* **Discoverability**: Threat requires extensive penetration testing in order to discover if it *potentially* exists. **Score: 2**  

#### DREAD Score: 5.4

***

### Attack Point D (Content Server -> Injectable Application):

Same as Point (B).

***

### Attack Point E (Injectable Application -> Host Page):

#### Host pages know the approximate length of content
**Threat Description**: The content injected into the page must tell the host page the height of the contained content, which is related to the length of the content.
  
* **Damage**: Knowing the length of content could provide information about the nature of the content: 4**  
* **Reproducibility**: A site would need to show a link to a user who is authorized for its content: **Score: 2**  
* **Exploitability**: Little expertise is required: **Score: 10**  
* **Affected Users**: It would be difficult to apply this exploit to many different users: **Score: 2**  
* **Discoverability**: Host pages could detect the height of any whitelisted content: **Score: 7**

#### DREAD Score: 5.0

***

### See Also

[Plain Posts Reading Threat Model](Plain-Posts-Reading-Threat-Model.md)

## 5. Vulnerabilities
*No vulnerabilities have been formally identified. Please contribute to this section!*

## Credit

Adapted from [Cryptocat's Threat Model](https://github.com/cryptocat/cryptocat/wiki/Threat-Model)
