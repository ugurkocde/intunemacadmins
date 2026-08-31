---
description: "A transparent record of what changed across IntuneMacAdmins, when it changed, where it was published, and which sources support it."
---

# Changelog

Every meaningful documentation change, in one place. Each entry shows what was added or corrected, the page that changed, and the authoritative source behind it.

<a href="home/whats-new.md" class="button primary">See the Latest Intune Updates</a> <a href="home/how-to-contribute.md" class="button secondary">Contribute a Change</a>

{% hint style="info" %}
**Transparent by design.** Content updates and verified corrections are written here by the same automation that updates the docs. A changelog entry is included in the pull request and passes the same validation and preview checks before publication.
{% endhint %}

<!-- changelog:entries -->

## August 31, 2026

<!-- changelog-entry:2d371d3e768b561e -->
### Declarative Device Management for Apple volume purchase program apps

**Content update** · Automatically published

Microsoft Intune now supports Apple Declarative Device Management (DDM) for required volume purchase program (VPP) apps on devices running iOS/iPadOS 17.2 and later and macOS 26 and later. Changing the management type to DDM when uploading a new VPP token allows apps to be deployed and configured using Apple's policy-based model, which provides real-time app status and per-app settings such as automatic app updates.

- **Published to:** [What's New for macOS Management](home/whats-new.md), [Declarative Device Management (DDM)](complete-guide-macos-deployment/declarative-device-management.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/en-us/intune/whats-new/#declarative-device-management-for-apple-volume-purchase-program-apps)

---

<!-- changelog-entry:1f579e42488c5eda -->
### New updates to the Apple settings catalog

**Content update** · Automatically published

Microsoft Intune now supports new Settings Catalog options for testing on the OS 27 betas, covering Declarative Device Management areas including App Settings, Web Content Filter, and Siri Settings for iOS/iPadOS and macOS. The settings can be configured under Devices, Manage devices, Configuration, Create, New policy, then iOS/iPadOS or macOS, and Settings catalog. This allows testing of upcoming Apple management controls ahead of general availability.

- **Published to:** [What's New for macOS Management](home/whats-new.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/en-us/intune/whats-new/#new-updates-to-the-apple-settings-catalog)

---

<!-- changelog-entry:8a48c5aaedcdbe8a -->
### Skip new Apple Setup Assistant panes during enrollment

**Content update** · Automatically published

Microsoft Intune now includes Apple OS 27 Setup Assistant skip keys for Liquid Glass and Accessibility Appearance in Automated Device Enrollment profiles. Administrators can hide these panes during enrollment on supported iPhone, iPad, and Mac devices. This applies to iOS/iPadOS and macOS.

- **Published to:** [What's New for macOS Management](home/whats-new.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/en-us/intune/whats-new/#skip-new-apple-setup-assistant-panes-during-enrollment)

---

<!-- changelog-entry:19cff33ed89851ec -->
### Collect enhanced diagnostic logs from supervised Apple devices

**Content update** · Automatically published

Microsoft Intune now supports Apple's Enhanced Logging device action on supported supervised devices running a compatible OS release. Administrators can start an AppleCare diagnostic-log collection session using an AppleCare-provided token and monitor device-reported status through Declarative Device Management. This applies to iOS/iPadOS and macOS and reduces the need to coordinate manual log collection with the device user.

- **Published to:** [What's New for macOS Management](home/whats-new.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/en-us/intune/whats-new/#collect-enhanced-diagnostic-logs-from-supervised-apple-devices)

## August 24, 2026

<!-- changelog-entry:f773ba56da46a327 -->
### Corrected Rapid Security Response

**Documentation correction** · Automatically published

The page uses the term "Rapid Security Responses" while the current source names the feature "Background Security Improvements".

- **Published to:** [Rapid Security Response](complete-guide-macos-deployment/rapid-security-response.md)
- **Source:** [Apple documentation](https://support.apple.com/guide/deployment/install-and-enforce-software-updates-depd30715cbb/web)

## August 17, 2026

<!-- changelog-entry:0af17248448f4c80 -->
### Corrected Rapid Security Response

**Documentation correction** · Automatically published

The page calls the feature "Rapid Security Responses", but the current source names it "Background Security Improvements".

- **Published to:** [Rapid Security Response](complete-guide-macos-deployment/rapid-security-response.md)
- **Source:** [Apple documentation](https://support.apple.com/guide/security/rapid-security-responses-sec87fc038c2/web)

---

<!-- changelog-entry:a7e91f5ac83c6de9 -->
### Corrected What is Microsoft Auto Update (MAU)?

**Documentation correction** · Automatically published

The page refers to "production" and "insider" channels; the source states Production and InsiderFast are deprecated, replaced by Current and Beta respectively.

- **Published to:** [What is Microsoft Auto Update (MAU)?](updating-microsoft-apps/microsoft-auto-update.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/microsoft-365-apps/mac/mau-preferences)

## August 10, 2026

<!-- changelog-entry:da5358fcaf7a480a -->
### Corrected Rapid Security Response

**Documentation correction** · Automatically published

The page says the feature starts with iOS 16.4.1/iPadOS 16.4.1/macOS 13.3.1, but the current source states Background Security Improvements are supported starting with iOS 26.1, iPadOS 26.1, and macOS 26.1.

- **Published to:** [Rapid Security Response](complete-guide-macos-deployment/rapid-security-response.md)
- **Source:** [Apple documentation](https://support.apple.com/guide/security/rapid-security-responses-sec87fc038c2/web)

---

<!-- changelog-entry:ec14cf4b349b0b63 -->
### Corrected Enable FileVault in Setup Assistant

**Documentation correction** · Automatically published

The page says to search for FileVault when adding settings, while the source says to navigate to the Full Disk Encryption category.

- **Published to:** [Enable FileVault in Setup Assistant](filevault/enable-filevault-in-setup-assistant.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/intune/device-configuration/endpoint-security/encrypt-filevault-macos)

## August 3, 2026

<!-- changelog-entry:2586eccb43563e30 -->
### Corrected Install the Company Portal app for MacOS as a MacOS LOB app

**Documentation correction** · Automatically published

The page says to select the app type without mentioning selecting the macOS platform first; the source states you select the macOS platform and then Line-of-business app.

- **Published to:** [Install the Company Portal app for MacOS as a MacOS LOB app](complete-guide-macos-deployment/install-the-company-portal-app-for-macos-as-a-macos-lob-app.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/intune/app-management/deployment/add-lob-macos)

---
<!-- changelog-entry:98ab4156d7b9e7af -->
### Custom compliance settings for macOS

**Content update** · Automatically published

Microsoft Intune now supports custom compliance settings for macOS, allowing admins to define compliance checks using scripts and JSON rules, similar to existing support for Windows and Linux. This capability can evaluate device configuration, security posture, and other custom attributes not covered by built-in settings. Results appear alongside standard compliance reporting in the Intune admin center.

- **Published to:** [What's New for macOS Management](home/whats-new.md), [Custom Compliance Settings for macOS](complete-guide-macos-deployment/custom-compliance-settings.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/en-us/intune/whats-new/#custom-compliance-settings-for-macos)

## July 27, 2026

<!-- changelog-entry:5c5025f62b5f3582 -->
### Corrected Configure Await Final Configuration

**Documentation correction** · Automatically published

The page refers to distinguishing it from other enrollment "profiles", but the source describes creating an enrollment "policy" and distinguishing it from other enrollment "policies".

- **Published to:** [Configure Await Final Configuration](await-final-configuration/configure-await-final-configuration.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/intune/device-enrollment/apple/setup-automated-macos)

---

<!-- changelog-entry:af67af44915f813c -->
### Corrected Antivirus Configuration

**Documentation correction** · Automatically published

The page lists 'Scanning inside archive files' without qualification, but the source states this setting applies to on-demand antivirus scans only.

- **Published to:** [Antivirus Configuration](baselinesettings/antivirusconfiguration.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/defender-endpoint/mac-preferences)

---

<!-- changelog-entry:3178dfd77cfdf294 -->
### Corrected Configure MacOS Platform SSO

**Documentation correction** · Automatically published

The page lists only Microsoft Edge, Google Chrome, and Safari as supported browsers, but the source also lists Firefox as a supported browser.

- **Published to:** [Configure MacOS Platform SSO](complete-guide-macos-deployment/configure-macos-platform-sso.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/intune/device-configuration/settings-catalog/configure-platform-sso-macos)

---

<!-- changelog-entry:06393e6fc2cc7cc0 -->
### Corrected Script to get the last reboot time formatted

**Documentation correction** · Automatically published

The page says the navigate is Devices \> macOS \> Custom Attributes; the current source describnavnavpath shthe settings are Devices \> By platform \> macOS \> Manage devices \> Scripts.

- **Published to:** [Script to get the last reboot time formatted](custom-attributes/create-custom-attributes.md)
- **Source:** [Microsoft Learn](https://learn.microsoft.com/intune/device-management/tools/run-shell-scripts-macos)

## July 14, 2026

<!-- changelog-entry:0d6bbbef8b21d6f7 -->
### Plan for change: Intune is moving to support macOS 15 and higher later this year

**Content update** · Automatically published

Microsoft Intune, the Company Portal app, and the Intune mobile device management agent will move to support macOS 15 and later, with the change occurring shortly after Apple's expected release of macOS 27 later in calendar year 2026. Devices already enrolled on macOS 14.x or below will remain enrolled, but new devices running macOS 14.x or below will be unable to enroll. Administrators can review Intune reporting under Devices and All devices, filter by macOS, and ask users to upgrade to a supported OS version.

- **Published to:** [What's New for macOS Management](home/whats-new.md)
- **Source:** [Microsoft Intune important notices](https://learn.microsoft.com/en-us/intune/whats-new/#plan-for-change-intune-is-moving-to-support-macos-15-and-higher-later-this-year)

---
<!-- changelog-entry:db5086e2aee1c5e6 -->
### The changelog moved to the main website

**Site update** · Maintainer published

Published the source-linked changelog at `www.intunemacadmins.com/changelog`, added a Changelog button to the main landing page that opens in a new tab, and connected the static page to the same automated changelog source used by the documentation workflows.

- **Published to:** [Main website changelog](https://www.intunemacadmins.com/changelog/), [IntuneMacAdmins landing page](https://www.intunemacadmins.com/)
- **Source:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)

---

<!-- changelog-entry:transparent-changelog-launch -->
### A transparent changelog moved to center stage

**Site update** · Maintainer published

Redesigned the old release list as a source-first timeline at `/changelog`, added a landing-page call to action, preserved the historical archive, and connected both documentation workflows so future content and corrections log themselves automatically.

- **Published to:** [Changelog](changelog.md), [IntuneMacAdmins home](README.md)
- **Source:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)

---

<!-- changelog-entry:initial-pkg-update -->
### macOS PKG apps can update automatically

**Content update** · Automatically published

Added Microsoft’s new behavior for available macOS PKG apps. When an admin uploads a newer version with the same bundle ID, previously installed available apps can update without another Company Portal action. The behavior requires Intune management agent version 2606.013 or later.

- **Published to:** [What’s New in Intune](home/whats-new.md)
- **Source:** [Microsoft Intune release notes](https://learn.microsoft.com/en-us/intune/whats-new/#available-macos-pkg-apps-update-automatically-when-you-upload-a-new-version)

---

<!-- changelog-entry:automation-launch -->
### Documentation updates became set-and-forget

**Site update** · Maintainer published

Rebuilt the content and freshness workflows so verified changes update existing pages first, create a well-placed page only when necessary, validate the exact pull request revision, merge automatically, and confirm GitBook and Vercel publication.

- **Published to:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)
- **Source:** [Automation implementation](https://github.com/ugurkocde/intunemacadmins/commit/607ef62289a5b4827b8b1b4d302a0838b7874da6)

---

<!-- changelog-entry:community-pulse-removal -->
### Community Pulse and Core Contributors were retired

**Site update** · Maintainer published

Removed the Community Pulse category, its generated pages and source collectors, plus the Core Contributors table. Community resources, tools, and the complete contributor list remain available in their established sections.

- **Published to:** [IntuneMacAdmins home](README.md), [Community resources](community/community-resources.md), [Contributors](home/contributors.md)
- **Source:** [Site cleanup](https://github.com/ugurkocde/intunemacadmins/commit/607ef62289a5b4827b8b1b4d302a0838b7874da6)

## Earlier releases

### Version 2.0 · September 2, 2024

**Content update** · Maintainer published

Introduced the Baseline Settings for Intune catalog, covering account security, antivirus, Defender, Edge, FileVault, Gatekeeper, Microsoft AutoUpdate, Office, OneDrive, Platform SSO, restrictions, and software updates.

### Version 1.7 · August 27, 2024

Added Microsoft Defender enrollment, Declarative Device Management, and Rapid Security Response guidance to the Complete Guide to macOS Deployment.

### Version 1.6 · August 23, 2024

Added Troubleshooting Guides, the Enrollment Error page, and Intune Uploader resources.

### Version 1.5 · August 19, 2024

Added page-level feedback, Company Portal LOB deployment guidance, and the managed-device user experience guide.

### Version 1.4 · August 8, 2024

Launched the Complete Guide to macOS Deployment with Apple Business Manager, Intune integration, device enrollment, Platform SSO, and FileVault setup guidance.

### Version 1.3 · August 2, 2024

Added the Snippets catalog with Packaging and Shortcuts.

### Version 1.2 · July 30, 2024

Expanded the FAQ with practical answers covering APNs, device lifecycle, migration, enrollment, Defender, certificates, custom settings, policy timing, local inspection, monitoring, and release tracking.

### Version 1.1 · July 29, 2024

Added the Intune Getting Started Guide, prerequisites, and basic tenant setup.

### Version 1.0.2 · July 25, 2024

Added the What’s New in Intune page and guidance for enrolling a Mac without Apple Business Manager.

### Version 1.0.1 · July 17, 2024

Corrected navigation and page titles and added the Root3 Support App.

### Version 1.0 · July 15, 2024

Published the first guides for Await Final Configuration, Custom Attributes, Declarative Device Management, FileVault, OneDrive Known Folder Move, Platform SSO, file deployment, and Microsoft app updates.
