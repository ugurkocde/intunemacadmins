---
description: "The macOS-relevant updates to Microsoft Intune, with links to the official release notes."
generated: true
---

# What's New in Intune

We track Microsoft's [What's new in Microsoft Intune](https://learn.microsoft.com/en-us/intune/whats-new/) release notes and pull out the changes that matter for macOS management. Each entry links to the full details on Microsoft Learn.

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

## Week of March 16, 2026

### Device management

- **Improved Remote Help update reporting on macOS** — Microsoft has updated the update and reporting experience for Remote Help on macOS. After deploying Remote Help client version 1.0.26012221 through Microsoft Intune, admins can view the full client version in device inventory and during app upgrades. Intune-deployed Remote Help installations are registered with Microsoft AutoUpdate, allowing managed macOS devices to automatically receive future updates. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#improved-remote-help-update-reporting-on-macos)

---

Older entries: see the full [What's new archive](https://learn.microsoft.com/en-us/intune/whats-new-archive) on Microsoft Learn.
