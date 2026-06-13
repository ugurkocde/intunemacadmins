---
description: "The macOS-relevant updates to Microsoft Intune, with links to the official release notes."
generated: true
---

# What's New in Intune

We track Microsoft's [What's new in Microsoft Intune](https://learn.microsoft.com/en-us/intune/whats-new/) release notes and pull out the changes that matter for macOS management. Each entry links to the full details on Microsoft Learn.

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

## Week of March 2, 2026 (Service release 2602)

### Device configuration

- **Apple declarative device management (DDM) supports assignment filters** — Microsoft Intune now supports assignment filters in policy assignments for declarative device management (DDM) based configurations, such as software updates. The feature applies to iOS/iPadOS and macOS, and is rolling out slowly with availability for all customers expected by late March 2026. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#apple-declarative-device-management-ddm-supports-assignment-filters)
- **New updates to the Apple settings catalog** — New settings have been added to the Intune Settings Catalog for Apple platforms. For iOS/iPadOS and macOS, an AirPlay Device Name setting is now available, and the macOS Microsoft Defender category has been updated with new settings. These can be configured by creating a Settings Catalog profile in the Microsoft Intune admin center. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#new-updates-to-the-apple-settings-catalog)

### Device security

- **Intune ending support for legacy Apple MDM software update policies** — With the release of iOS 26, iPadOS 26, and macOS 26, Apple has deprecated legacy MDM software update commands and payloads, and Microsoft Intune will soon end support for creating legacy iOS/iPadOS and macOS software update policies. To continue managing Apple software updates, administrators should configure update policies using Apple's declarative device management (DDM) model, which Microsoft states provides improved device autonomy and reporting. The change applies to iOS/iPadOS and macOS. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#intune-ending-support-for-legacy-apple-mdm-software-update-policies)

## Week of December 8, 2025

### Device enrollment

- **New Setup Assistant screens now generally available for iOS/iPadOS and macOS automated device enrollment profiles** — Microsoft Intune now generally supports hiding or showing 12 new Setup Assistant screens during automated device enrollment for iOS, iPadOS, and macOS, with the default being to show these screens. For iOS/iPadOS, skippable screens include App Store, Camera button, Web content filtering, Safety and handling, Multitasking, and OS Showcase across various OS versions. For macOS, skippable screens include App Store, Get Started, Software update, Additional privacy settings, OS Showcase, and Update completed. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#new-setup-assistant-screens-now-generally-available-for-ios-ipados-and-macos-automated-device-enrollment-profiles)
- **ACME protocol support for iOS/iPadOS and macOS enrollment** — Microsoft Intune is beginning a phased rollout that adds support for the Automated Certificate Management Environment (ACME) protocol as part of preparing for managed device attestation. New Apple device enrollments will receive an ACME certificate instead of a SCEP certificate, while existing eligible devices keep their current certificate unless they re-enroll. ACME is supported for Apple Device Enrollment (BYOD), Apple Configurator enrollment, and automated device enrollment on iOS 16.0 or later, iPadOS 16.1 or later, and macOS 13.1 or later, with no change to the end-user experience, admin center, or device configuration policies. [Details](https://learn.microsoft.com/en-us/intune/whats-new/#acme-protocol-support-for-ios-ipados-and-macos-enrollment)

---

Older entries: see the full [What's new archive](https://learn.microsoft.com/en-us/intune/whats-new-archive) on Microsoft Learn.
