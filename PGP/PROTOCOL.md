# Outline and Purpose

The Privly PGP keymanager app is built on top of Mozilla Persona for key
sharing. This page describes how the Privly PGP app uses Persona for identity
certificates and public key discovery at a high level.

Mozilla's Persona allows users to log into supporting websites using identities
signed by an email domain provider. Anyone with a domain can choose
to sign identities. Those who don't sign identities may allow Mozilla to act as
a fallback identity provider on the domain.

Here we build on top of the Persona protocol such that we can use existing
Persona identity servers to verify an email address, associate it with a
PGP key, and enable authenticated secure sharing of content.

This document was copied and modified from the original found at:
https://developer.mozilla.org/en-US/Persona/Protocol_Overview

# Actors

The protocol involves five actors:

*  Uploading Users (UUs): People that want to upload their PGP public key and
           associated identity to a public directory.
*  Relying Users (RUs): People that want to discover a trusted public key.
*  Directory Provider (DPs): A key-value store for holding associations between
           identities and PGP public keys. 
*  Identity Providers (IdPs): Domains that can issue Persona-compatible 
           identity certificates to their users.
*  Remote Verifier (RV): The service that verifies cryptographic assertions of
           identity.

Persona and the BrowserID protocol use email addresses as identities, so it's
natural for email providers to become IdPs.

Mozilla operates a fallback IdP so that users can use any email address with
Persona, even one with a specific domain that isn't an IdP itself.  

This extension to Persona uses, unmodified, the existing infrastructure for
IdPs and remote verifiers.

#Protocol Steps

There are two activities performed on top of the Persona protocol:

###Logging in

Logging in consists of five distinct steps. We add uploading to the
original protocol. This is performed without modifications beyond the
browser extension.

1.  User Certificate Provisioning 
1.  Persona Assertion Generation 
1.  Privly Assertion Generation (not a part of standard persona protocol)
1.  Uploading to DP (not a part of standard persona protocol)
1.  Assertion Verification

###Adding Keys to local key manager

(not a part of standard persona protocol) This process is for importing trusted
keys into a keystore defined inside a browser extension.

1.  RU queries DP for public key
1.  RU queries RV for validity of key returned from DP
1.  RU stores key if verified

As a prerequisite, the UU should have an identity (email address) that they
wish to publicly disclose and associate with a PGP public key. The
protocol does not require that IdP-backed identities are SMTP-routable,
but it does require that identities follow the user@domain format.  

##User Certificate Provisioning

In order to upload their identity assertion and public key to the DP, a
user must be able to prove ownership of their preferred email address.  The
foundation of this proof is a cryptographically signed certificate from an IdP
certifying the connection between a browser's user and a given identity within
the IdP's domain.

Because Persona uses standard public key cryptography techniques, the user
certificate is signed by the IdP's private key and contains:

*  The user's email address.
*  The time that the certificate was issued.
*  The time that the certificate expires.
*  The IdP's domain name.
*  The user's Persona public key.

The user's browser generates a different Persona keypair for each of the user's
email addresses, and these keypairs are not shared across browsers.  Thus, a
user must obtain a fresh certificate whenever one expires, or whenever using a
new browser or computer. 

When the Persona public key expires or a user generates a new one, the
extension attempts to obtain a new user certificate from the domain
associated with the chosen identity.

1.  The browser fetches the /.well-known/browserid support document over SSL
    from the identity's domain.
1.  Using information from the support document, the browser passes the user's
    email address to the IdP and requests a signed certificate.
1.  If necessary, the user is asked to sign into the IdP before provisioning
    proceeds.
1.  The IdP creates, signs, and returns the user certificate to the browser.
1.  The UU's browser extension caputres the certificate and the user's private
    and public keypair.

##Persona Assertion Generation

The user certificate establishes a verifiable link between an email address and
a public key. However, this is alone not enough to log into a website: the user
still has to show their connection to the certificate by proving ownership of
the persona private key.

In order to prove ownership of a private key, the user's browser creates and
signs a new document called a "persona identity assertion." It contains:

*  The origin (scheme, domain, and port) of the DP that the user wants to sign
  into.  
*  An expiration time for the assertion, generally less than five minutes
  after it was created.

The browser then presents both the User Certificate and the Identity Assertion
to the DP for verification.  Note that the DP performs a verification only for
the purposes of ensuring that it is not storing junk data. After the RU
downloads a Backed Identity Assertion from the DP, it performs a verification
before trusting the assertion.

##Privly Assertion Generation

Now, a Privly keypair is generated. The browser extension has access to the
User Certificate as well as the Persona keypair. The Persona keypair signs the
Privly public key. This adds a link in the chain of trust, asserting the
identity of the privly public key.  

In order to prove ownership of a private key, the user's browser creates and
signs a new "privly identity assertion" that is consistent with the Persona
Identity assertion format. It contains:

*  The origin (scheme, domain, and port) of the directory that the user
   wants to be entered into.
*  An expiration time for the assertion, generally less than a month
   after it was created. 
*  The public key of the Privly keypair generated by the user's browser.


##Uploading to DP

The browser then presents the user certificate and both identity assertions
to the DP. The DP goes over a basic check of the data uploaded to it.  The
checks first ensures it is in the expected format.  Then a remote verifier is
called to make sure the data it stores was valid at the time of entry.  Upon
retrieval of data from the DP, the RU verfies the data again.

##Persona Assertion Verification

The combination of User Certificate and Identity Assertion, refered to
as a Backed Identity Assertion, is sufficient to confirm a user's identity.

First, the DP checks the domain and expiration time in the assertion. If the
assertion is expired or intended for a different domain, it's rejected. This
prevents malicious re-use of assertions.

Second, the DP validates the signature on the assertion with the Persona public
key inside the user certificate. If the key and signature match, the DP is
assured that the current user really does possess the key associated with the
certificate.

Third, the DP fetches the IdP's public key from its /.well-known/browserid
document and verifies that it matches the signature on the user certificate. If
it does, then the DP can be certain that the certificate really was issued by
the domain in question.

Last, the Backed Identity Assertion is added twice to the key-value store. The
first entry is keyed by the email address to allow RUs to discover privly public
keys. The second entry is keyed with the Privly public key to support a RU
locating the email address of a signature from a contact not yet established.

Once these steps are complete the DP returns to the UU the results of the
verification.  Additionally, if there is any error while adding the Backed
Identity Assertion into the key-value store it is included in the return value.

At this point during the standard Persona sign-in process the UU would be
signed in.  Since we are making the Backed Identity Assertion public knowledge
this would allow any user to masquerade as any other user.  For this reason the
DP only has a notion of being signed in for the purposes of cooperating with
the existing protocol.  Being 'signed in' does not provide a user with any
additional knowledge compared to a user that is 'signed out.'

## RU queries DP for public key
Here, the RU wants to discover a public key for an UU. The RU queries the
directory provider with an email address, and receives a list of public keys.

## RU queries RV for validity of keys returned from DP
The RU evaluates all returned keys to see if they are not expired. Those that
are not expired are sent to the RV for verification.

## RU stores key if verified
The keys verified by the RV are then stored locally.

#The Persona Fallback Verifier

Architecturally Persona is built such that verification is performed by a
remote service.  It is the intention of the persona team to incorporate this
natively into the browser. At the time of this writing this is not the case so
we are unable to remove this from the protocol. As the system matures we will
look to incorporate natively into the extension if it is not in the browser.

#The Persona Fallback IdP

What if a user's email provider doesn't support Persona? In that case, the
provisioning step would fail. By convention, the user's browser handles this by
asking a trusted third party, https://login.persona.org/, to certify the user's
identity on behalf of the unsupported domain. After demonstrating ownership of
the address, the user would then receive a certificate issued by the fallback
IdP, login.persona.org, rather than the identity's domain.

DPs follow a similar process when validating the assertion: the DP would
ultimately request the fallback IdP's public key in order to verify the
certificate.


# Use case overview
## Use case 1: 
User uploads a Privly public key to the directory provider. 

This use case involves the following steps:

1.    Generation of the User Certificate from the browser extension.
1.    Send the certificate to the IdP.
1.    IdP creates an Identity Assertion.
1.    Returns the Identity Assertion to the user.
1.    User uploads the Backed Identity Assertion and PGP public key to the DP.

## Use case 2: 
User wants to find the Privly PGP public key associated with an identity
(email address).

1.    User send the DP a specific e-mail address or public key.
1.    Directory provider returns the Backed Identity Assertion along
      with the Privly public key.
1.    The browser extension checks that the Persona public key signed
      the Privly Assertion.
1.    The browser extension sends the Identity Assertion to the verifier.
1.    The verifier evaluates the assertion and responds to the client.
1.    The Privly public key is valid and can now be used.

### Caveat
Because we are unaware of any verifier libraries that can run in the
local context of a browser extension, initially we will not be doing
verification from the browser extension. The first version of our
implementation will make use of a remote verifier.  Eventually we would
like to remove the threat model of trusting a remote verifier resource.

## Expected JSON Request to DP

The DP expects a object containing two things.

  1.   Backed Identity Assertion 
  1.   Privly Assertion

These two objects verify that a user's identity:

*  Is associated with the given Privly PGP public key
*  Is a valid email address owned by the user and provided by the IdP.

