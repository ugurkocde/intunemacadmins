---
title: FAQ
---

## 1. What happens if my VPP Token expires?

If your VPP (Volume Purchase Program) token expires, the following issues will occur:

- App Deployment Stops: You won't be able to deploy new apps or updates to existing apps to devices enrolled in Intune.
- App Licenses Unavailable: The existing VPP app licenses won't be available for reallocation, and you might encounter issues with app installations.
- Managed Distribution Stops: Managed distribution of apps purchased through Apple Business Manager will cease to function.
- Reporting and Synchronization Issues: Reporting on app installations and synchronization between Intune and Apple Business Manager might fail.

## 2. What happens if my Enrollment Token expires?

If your Apple Device Enrollment Program (DEP) token expires, the following issues will occur:

- Device Enrollment Stops: You won't be able to enroll new devices into Intune using Apple Business Manager. Any devices that need to be enrolled through DEP will not be able to complete the enrollment process.
- Profile Assignment Fails: You won't be able to assign or push configuration profiles, policies, and apps to newly enrolled devices.
- Device Management Issues: Newly added devices in Apple Business Manager won't synchronize with Intune, leading to management and compliance issues.
- Communication Break: There will be a break in communication between Intune and Apple Business Manager, affecting any actions that require syncing, like device information updates.

## 3. User vs Device Assignments

When should you assign a policy to a user versus a device?

### Device groups

If you want to apply settings on a device, regardless of who's signed in, then assign your policies to a devices group. Settings applied to device groups always go with the device, not the user.

### User groups

Policy settings applied to user groups always go with the user, and go with the user when signed in to their many devices.

Source: [User groups vs. device groups](https://learn.microsoft.com/en-us/mem/intune/configuration/device-profile-assign#user-groups-vs-device-groups)

## 4. What are the best practices for managing macOS updates through Intune?

To make use of the newest features that Apple releases for better User experience and increased Device Security (e.g. PSSO with Secure Enclave) it is recommended to be atleast at MacOS Sonoma (Version 14.0) or even better stay current.

There are multiple options to setup updates, Update Policies and Declerative Device Management, for MacOS in Intune and currently its best to combine them.

1. You can setup a default configuration with a "macOS updates policy" where you can define the update behavior (e.g. Download and Install Critical Updates) and setup a schedule.
2. There will be cases where you want to roll out a new update that patches some vulnerabilities in the OS. In those situations better add a new Update Profile with Declerative Device Management to the above setting. You have to create a new configuration profile with the settings catalog where you can configure DDM - Software Updates. In this profile we are able to select a target date time for the update as well as the OS Version we want to install. The user experiences a couple of notifications to save their work before finally the device force reboots at that configured target date and time.

Note:
- Setting up both Profiles will not cause errors in the assignments as both are different payloads.
- Not setting the OS Version in the DDM Profile will automatically install the newest available version for that Mac Device (this depends on the hardware and the OS it supports).


## 5. How can I deploy and manage third-party applications on macOS devices using Intune?

Most vendors offer a .dmg or .pkg file to install the application. Both extensions are supported in Intune and can be uploaded and assigned to Devices and Users.

There could be cases where you have to package your own application e.g. licence files and in those cases you can use some of the steps we provide here: [How to deploy Files](https://www.intunemacadmins.com/deploy-files/how_to_deploy_files/)