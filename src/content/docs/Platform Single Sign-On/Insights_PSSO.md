---
title: Insights
sidebar:
  order: 3
---

- Before setting up PSSO you should think about your approach and communication with the enduser. While your Security Department could expect you to implement the most secure Authentication Method, in this case this is Secure Enclave, your users and the IT Department would expect to use a single password for the local and online (EntraID) accounts.

- Secure Enclave only provides this additional security layer by NOT storing the keys and tokens in the Keychain like the Password method does. 

- Secure Enclave could still be the best user experience because users do not need to technically use a password when they use touch id for the sign-in. This way a missing password sync will not be that important anymore but still be phishing resistant.

- Tokens and Keys stored in the Secure Enclave are Hardware Bound (Phishing Resistant). You can not export Tokens or Sync them via iCloud which makes this the most secure way.

- Secure Enclave with PSSO and TouchID has a very similar User Experience feeling like Windows Users have with Windows Hello for Business.

- The Password Method is storing Keys in the KeyChain which is software based. Users or Attackers could export the tokens and reuse them on a different device. This is why Microsoft and Apple is recommending to use Secure Enclave.