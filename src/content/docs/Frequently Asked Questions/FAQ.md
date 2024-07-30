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

## 6. Can I enroll a MacOS Device in Intune without ABM?

Yes, you can enroll a MacOS Device in Intune without ABM. You can use the Company Portal App to do so. Devices added this way will have the "Personal" Ownership Type in Intune. The enrollment could therefore be blocked by your device enrollment restrictions.

<<<<<<< Updated upstream
BUT: Not having the device in ABM means the device is not supervised and therefore the user could wipe a machine and/or remove your MDM profile. 
=======
## 7. What happens if my Apple Push Notification service (APNs) Token expires?
The APNs token must be renewed yearly. If you miss the renewal and the grace period, you must re-enroll all devices. Personally-owned devices must re-trigger the enrollment process in Company Portal to get a new management profile, but for corporate-owned device enrolled with Apple Automated Device Enrollment, where the profile is usually non-removable, you must wipe and re-enroll all devices.
Make sure you monitor the expiration of the APNs token.

## 8. Which steps do I need to take when a Mac reaches end-of-life?
First of all, you should ensure that the system is properly wiped and all data is deleted. From Intune you can send a wipe request. The device object will get deleted with the wipe sent from Intune, but if start the wipe on the device itself, you need to delete the Intune object. Make sure the corresponding Entra ID object was also deleted. If not, do so manually.
If your Mac was registered in your Apple Business or School Manager, you should also delete it from there.

## 9. Do I need to reset my Mac to enroll it in Intune?
No, that is not needed by default. You can start the enrollment on an operating Mac with enrollment through Company Portal. However, if you want the device to be completely corporate-owned and managed, you should consider a reset and import to Apple Business or School Manager and choose Apple Automated Device Enrollment for the provisioning.

## 10. Can I add my Mac to my Apple or Business or School Manager after I ordered it?
Usually your vendor or supplier registers your MacOS devices in your instance of ABM/ASM. If that is not the case, you can manually add the Mac. The simplest way to achieve Automated Device Enrollment, is to reset the Mac and start the setup process until you get to the region selection. From there you can add the Mac by scanning the shape with your iPhone and the Apple Configurator App. [Apple Guide](https://support.apple.com/guide/apple-configurator/add-a-new-mac-apd65c9ff558/ios)

## 11. We are considering switching our existing MDM to Intune to manage macOS, how should we plan this?
Switching from an alternate MDM to Intune for macOS is worth trying! Most often you already have an Intune license and maybe even use Intune to manage other operating systems.
Planning a switch includes multiple steps, but can be broken down into the most crucial: 1. Do a Proof-of-Concept (POC) and verify if all your desired features are given 2. Check process compatibility, to see if Intune supports your established organizational processes 3. Plan the Intune deployment and define which configurations should be done. Orientate with frameworks and best practices. This community is a great start to do so :)

## 12. MacOS and Apple security - where do I get information?
Different operating systems and vendors offer different security technologies, features and services. Apple published their [Platform Security Guide](https://support.apple.com/guide/security/welcome/web) with all you need to know about macOS and Apple security.

## 13. Can I onboard my Mac to Defender for Endpoint?
Of course! Defender for Endpoint supports macOS and onboarding can be achieved with Intune configuration profiles and a Defender onboarding package.

## 14. Does Intune support certificate deployment to macOS?
Yes, Intune supports trusted certificate deployment, or PKCS, or SCEP certificates to be deployed to managed Macs. All you need is Cloud PKI from Intune Suite or the Intune Certificate Connector to deploy certificates from your internal PKI to the Mac.

## 15. Some settings are not covered by Intune (UI), what do I do?
There are multiple things you can do, if settings are not reflected in Settings Catalog or via a Template in Intune. Of course you can always create a shell script to configure any setting on the system. But the preferred way may be, to create a Intune custom .mobileconfig file and deploy it to your Macs.

## 16. The profiles of Intune are applied too slow to my managed Macs. What can I do?
First of all, you should identify potential misconfiguration in the profiles. Make sure there are no errors, conflicts or misconfigurations.
To speed up the processing of Intune, it is recommended to use Intune filters instead of Entra dynamic or static groups.

## 17. Where can I see which profiles of Intune were applied locally on my Mac?
Go to Settings > Privacy & Security. There you should see all profiles and policies applied by the management system.

## 18. How do I monitor my managed Macs in Intune?
You can see all enrolled Macs in the platform page of Intune under macOS. You can choose any device and see hardware information, Intune metadata and the status of applied profiles, policies and apps. Additionally, under Devices > Monitoring you have multiple built-in Intune reports in different categories.

## 19. How do I stay up to date with new Intune macOS features?
The best way to stay up to date with new Intune macOS features is to follow communites and the official Microsoft blogs. Visiting events is another crucial part to meet the latest & greatest new features and experts on the field. Of course, also this community is a great place to learn more and get updates.

## 20. How do I get an Apple Business or School Manager?
You need to register at [Apple Business](https://support.apple.com/guide/apple-business-manager/sign-up-axm402206497/web), get a D-U-N-S number and let Apple verify your request. Afterwards, it is possible to configure the various connections to Intune and use all services.
>>>>>>> Stashed changes
