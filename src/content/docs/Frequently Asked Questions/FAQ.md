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