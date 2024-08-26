---
title: Prerequisites
description: Learn about the prerequisites for macOS management with Intune.
sidebar:
    order: 1
---

# Goals 🎯
In this section it is described how to easily set up the core management of macOS with Microsoft Intune. We will walk through:

 - Preparing the setup and plan for macOS management
 - Setting up the Intune tenant
 - Implementing policies for configuration, compliance and security

# Prerequisites
When aiming for macOS management with Intune, you need to verify the following technical subjects as prerequisite:
-   MDM user scope set to ‘all’

![IntuneSetup](/src/assets/IntuneSetup/mdmscope.png)
-   Intune administrator role
- Intune plan 1 license
-   Enrollment device limit restrictions > default value
-   Enrollment device platform restrictions > depending on which platform to enroll (corporate or personal)

![IntuneSetup](/src/assets/IntuneSetup/enrollmentrestrictions.png)
-   Apple Certificates and Tokens
    -   [APNS](https://learn.microsoft.com/en-us/mem/intune/enrollment/apple-mdm-push-certificate-get) (required)
        -   Used for communication between Intune and the device
        -   Not needing Apple Business Manager

![IntuneSetup](/src/assets/IntuneSetup/apns.png)
    -   [Enrollment program token](https://learn.microsoft.com/en-us/mem/intune/enrollment/macos-enroll?ref=oceanleaf.ch#enable-enrollment-in-microsoft-intune) (optional)
        -   Used for Automatic Device Enrollment from ABM to Intune
        -   Requires Apple Business Manager
    -   [VPP](https://learn.microsoft.com/en-us/mem/intune/apps/vpp-apps-ios) (optional)
        -   Used to deploy apps from ABM via Volume Purchase Program
        -   Requires Apple Business Manager

## Before you start
It is not just about the technical! Be sure to also have the organizational prerequisites met. Some of the considerations include:
-   Approval by security responsible to use Macs for organizational use
-   Define your Mac management strategy
    -   Which devices are supported? personal/corporate
    -   Which identities are used? no Apple ID, personal Apple ID, managed Apple ID
    -   Choose user accounts + single-sign on (SSO) type: Enterprise SSO plug-in/platform SSO
    -   Define macOS policies, compliance and security requirements
-  Define project goals for stakeholders
- Plan project initiative
- Project budget and sponsors


