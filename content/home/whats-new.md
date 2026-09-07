---
description: "The released Microsoft changes and important notices that matter for macOS management, with links to the authoritative sources."
generated: true
---

# What's New for macOS Management

We track [released Microsoft Intune changes](https://learn.microsoft.com/en-us/intune/whats-new/), important macOS notices, and substantive Microsoft Defender for Endpoint releases. Each entry links to the authoritative Microsoft source.

## Important macOS notices

Actionable support, enrollment, and service changes that macOS administrators should prepare for.

- **Plan for change: Intune is moving to support macOS 15 and higher later this year** — Microsoft Intune, the Company Portal app, and the Intune mobile device management agent will move to support macOS 15 and later, with the change occurring shortly after Apple's expected release of macOS 27 later in calendar year 2026. Devices already enrolled on macOS 14.x or below will remain enrolled, but new devices running macOS 14.x or below will be unable to enroll. Administrators can review Intune reporting under Devices and All devices, filter by macOS, and ask users to upgrade to a supported OS version. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#plan-for-change-intune-is-moving-to-support-macos-15-and-higher-later-this-year)

## Microsoft Defender for Endpoint for macOS

Substantive security, management, and compatibility changes. Routine build-only updates are excluded.

- **Microsoft Defender for Endpoint 101.26062.0011 for macOS** — Microsoft Defender for Endpoint version 101.26062.0011 for macOS expands local AI agent discovery, currently in preview, to include visibility into Model Context Protocol (MCP) server configurations. The release also includes performance improvements and bug fixes. [Details](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-releases#macos-august-2026-101-26062-0011)
- **Microsoft Defender for Endpoint 101.26062.0009 for macOS** — Microsoft Defender for Endpoint version 101.26062.0009 for macOS includes bug and performance fixes. Network diagnostics have been extended with the mdatp health --details network\_configuration command. [Details](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-releases#macos-july-2026-101-26062-0009)

## Released Microsoft Intune updates

## Week of August 25, 2026 (Service release 2608)

### App management

- **Declarative Device Management for Apple volume purchase program apps** — Microsoft Intune now supports Apple Declarative Device Management (DDM) for required volume purchase program (VPP) apps on devices running iOS/iPadOS 17.2 and later and macOS 26 and later. Changing the management type to DDM when uploading a new VPP token allows apps to be deployed and configured using Apple's policy-based model, which provides real-time app status and per-app settings such as automatic app updates. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#declarative-device-management-for-apple-volume-purchase-program-apps)

### Device configuration

- **New updates to the Apple settings catalog** — Microsoft Intune now supports new Settings Catalog options for testing on the OS 27 betas, covering Declarative Device Management areas including App Settings, Web Content Filter, and Siri Settings for iOS/iPadOS and macOS. The settings can be configured under Devices, Manage devices, Configuration, Create, New policy, then iOS/iPadOS or macOS, and Settings catalog. This allows testing of upcoming Apple management controls ahead of general availability. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#new-updates-to-the-apple-settings-catalog)

### Device enrollment

- **Skip new Apple Setup Assistant panes during enrollment** — Microsoft Intune now includes Apple OS 27 Setup Assistant skip keys for Liquid Glass and Accessibility Appearance in Automated Device Enrollment profiles. Administrators can hide these panes during enrollment on supported iPhone, iPad, and Mac devices. This applies to iOS/iPadOS and macOS. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#skip-new-apple-setup-assistant-panes-during-enrollment)

### Device management

- **Collect enhanced diagnostic logs from supervised Apple devices** — Microsoft Intune now supports Apple's Enhanced Logging device action on supported supervised devices running a compatible OS release. Administrators can start an AppleCare diagnostic-log collection session using an AppleCare-provided token and monitor device-reported status through Declarative Device Management. This applies to iOS/iPadOS and macOS and reduces the need to coordinate manual log collection with the device user. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#collect-enhanced-diagnostic-logs-from-supervised-apple-devices)

## Week of July 27, 2026 (Service release 2607)

### Device security

- **Custom compliance settings for macOS** — Microsoft Intune now supports custom compliance settings for macOS, allowing admins to define compliance checks using scripts and JSON rules, similar to existing support for Windows and Linux. This capability can evaluate device configuration, security posture, and other custom attributes not covered by built-in settings. Results appear alongside standard compliance reporting in the Intune admin center. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#custom-compliance-settings-for-macos)

## Week of June 29, 2026 (Service release 2606)

### App management

- **Available macOS PKG apps update automatically when you upload a new version** — Available macOS PKG apps now update automatically on devices when an existing available app policy is edited with a newer app version that uses the same bundle ID, without users needing to select Install or Reinstall in Company Portal. Automatic updates apply when an updated app version is uploaded to Intune and the user has already installed the app. This behavior requires the Microsoft Intune management agent for macOS version 2606.013 or later. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#available-macos-pkg-apps-update-automatically-when-you-upload-a-new-version)

## Week of June 15, 2026

### Device enrollment

- **Enrollment time grouping for new Apple ADE enrollment policies generally available** — Enrollment time grouping is now generally available for Apple automated device enrollment (ADE) on iOS, iPadOS, and macOS. It allows a device's Microsoft Entra security group to be identified during enrollment so policies, apps, and settings can be applied earlier in the setup process. The feature is supported in new Apple ADE enrollment policies. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#enrollment-time-grouping-for-new-apple-ade-enrollment-policies-generally-available)

## Week of June 8, 2026 (Service release 2605)

### Custom top bar elements on Managed Home Screen &lt;!-- 25008744 --&gt;

- **Disable MAC address randomization on macOS Wi-Fi profiles** — Microsoft Intune now offers a Disable MAC address randomization setting for macOS Wi-Fi profiles, allowing administrators to turn off MAC address randomization on managed macOS devices. Randomized MAC addresses support privacy but can break functionality that relies on a static MAC address, including network access control. The setting applies to macOS 15 and later. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#disable-mac-address-randomization-on-macos-wi-fi-profiles)
- **Use DDM to manage Apple Intelligence settings on devices running 26.4 and later** — With Apple's 26.4 release, several intelligence-related settings in the MDM restrictions payload were deprecated, and Microsoft directs admins to use DDM configurations released in March 2026 instead. The deprecated items include numerous Restrictions in the settings catalog such as Allow Assistant, Allow Dictation, Allow Writing Tools, and Allow Genmoji, along with device restrictions template settings for Siri, keyboard, and dictionary. The changes apply to iOS, iPadOS, and macOS. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#use-ddm-to-manage-apple-intelligence-settings-on-devices-running-26-4-and-later)

## Week of May 11, 2026

### Device enrollment

- **Complete Platform SSO registration during macOS Automated Device Enrollment** — Microsoft documented support for running Platform Single Sign-On during macOS Automated Device Enrollment. Configuration requires creating an Intune settings catalog policy with the Enable Registration During Setup setting, deploying Company Portal 5.2604.0 or newer as a line-of-business app, and setting the ADE policy to use Setup Assistant with modern authentication and await final configuration. When enabled, users gain access to Microsoft Entra ID resources upon arriving at the desktop, and the feature applies to macOS 26 and newer. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#complete-platform-sso-registration-during-macos-automated-device-enrollment)

---

Full source histories: [Microsoft Intune archive](https://learn.microsoft.com/en-us/intune/whats-new-archive) and [Microsoft Defender for Endpoint releases](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-releases).
