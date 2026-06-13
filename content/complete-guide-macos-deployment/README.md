---
description: "An end-to-end guide to deploying and enrolling macOS devices with Microsoft Intune, from Apple Business Manager to FileVault, Platform SSO, and Microsoft Defender."
lastReviewed: 2026-06-13
---

# Complete Guide Macos Deployment

This section walks through a full macOS deployment with Microsoft Intune, in the order you would build it: connecting Apple Business Manager, enrolling devices, and layering on the configuration and security policies that make up a production-ready setup. It is written for IT administrators standing up automated device enrollment (ADE) for Mac for the first time, as well as those refining an existing deployment.

Follow the pages below in sequence for a complete deployment, or jump to a specific step you are working on.

- [**Apple Business Manager**](./apple-business-manager.md) — Set up and use Apple Business Manager for efficient device management.
- [**Integrate Apple Business Manager with Intune**](./integrate-apple-business-manager-with-intune.md) — Create an Apple MDM Push certificate and set up the ADE token.
- [**Add a device to Apple Business Manager**](./add-a-device-to-apple-business-manager.md) — Add devices with Apple Configurator and sync them to Intune.
- [**Configure MacOS Platform SSO**](./configure-macos-platform-sso.md) — Configure Platform SSO with a Secure Enclave key during enrollment.
- [**Enable FileVault during the Setup Assistant**](./enable-filevault-during-the-setup-assistant.md) — Turn on FileVault disk encryption as part of device setup.
- [**Install the Company Portal app as a macOS LOB app**](./install-the-company-portal-app-for-macos-as-a-macos-lob-app.md) — Download, add, and assign Company Portal as a line-of-business app.
- [**User Experience on a MacOS Device**](./user-experience-on-a-macos-device.md) — A screenshot walkthrough of the end-user enrollment experience.
- [**Enroll MacOS in Microsoft Defender**](./enroll-macos-in-microsoft-defender.md) — Onboard macOS devices to Microsoft Defender for Endpoint via Intune.
- [**Declarative Device Management (DDM)**](./declarative-device-management.md) — Apply settings and report status asynchronously with DDM.
- [**Rapid Security Response**](./rapid-security-response.md) — Deliver critical security fixes to Mac between full updates.
