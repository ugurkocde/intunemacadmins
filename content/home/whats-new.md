---
description: "The released Microsoft changes and important notices that matter for macOS management, with links to the authoritative sources."
generated: true
---

# What's New for macOS Management

We track [released Microsoft Intune changes](https://learn.microsoft.com/en-us/intune/whats-new/), important macOS notices, and substantive Microsoft Defender for Endpoint releases. Each entry links to the authoritative Microsoft source.

## Important macOS notices

Actionable support, enrollment, and service changes that macOS administrators should prepare for.

- **Plan for change: Intune is moving to support macOS 15 and higher later this year** — Microsoft Intune, the Company Portal app, and the Intune mobile device management agent will move to support macOS 15 and later, with the change occurring shortly after Apple's expected release of macOS 27 later in calendar year 2026. Devices already enrolled on macOS 14.x or below will remain enrolled, but new devices running macOS 14.x or below will be unable to enroll. Administrators can review Intune reporting under Devices and All devices, filter by macOS, and ask users to upgrade to a supported OS version. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#plan-for-change-intune-is-moving-to-support-macos-15-and-higher-later-this-year)

## Released Microsoft Intune updates

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

## Week of April 27, 2026 (Service release 2604)

### Device enrollment

- **Access management for Apple services** — Apple access management settings in Apple Business Manager and Apple School Manager can now be used to configure service access for Apple accounts on organization-owned devices. These controls determine which devices users can sign in to and which apps and services are available to them. The feature applies to iOS, iPadOS, and macOS. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#access-management-for-apple-services)

## Week of March 30, 2026 (Service release 2603)

### Device configuration

- **New updates to the Apple settings catalog** — New settings have been added to the Intune Settings Catalog for iOS/iPadOS and macOS. The additions include Declarative Device Management options for External Intelligence Settings, Intelligence Settings, Keyboard Settings, and Siri Settings, along with macOS-specific System Configuration File Provider settings and a Rosetta Usage Awareness restriction. The settings are accessible by creating a Settings Catalog profile in the Microsoft Intune admin center under Devices, Configuration. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#new-updates-to-the-apple-settings-catalog)
- **Recovery lock features available for macOS devices** — Microsoft Intune now supports configuring a recovery OS password on macOS devices to prevent users from booting company-owned devices into recovery mode, reinstalling macOS, or bypassing remote management. The feature can be enabled and set with a password rotation schedule through a settings catalog policy, or rotated manually using the Recovery Lock device action. The Recovery Lock password is viewable in the per-setting status report under Passwords and keys, requiring the View macOS recovery lock password permission. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#recovery-lock-features-available-for-macos-devices)

---

Full source histories: [Microsoft Intune archive](https://learn.microsoft.com/en-us/intune/whats-new-archive) and [Microsoft Defender for Endpoint releases](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-releases).
