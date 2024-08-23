---
title: Enrollment Error
sidebar:
  order: 1
---

When attempting to enroll a macOS device in Intune after creating an Apple MDM push certificate, 
you may encounter the following error in the Company Portal app:

_"Couldn't add your device. Your IT support doesn't allow OSX devices to be added to management."_

![IntuneSetup](/src/assets/Troubleshooting/Enrollment_Error/CompanyPortalError.png)

To resolve this issue, follow these steps:

**Step 1: Check Enrollment Failures in Intune**

1. Navigate to the Intune portal.
2. Go to Devices > Enrollment > Monitor > Enrollment failures.
3. Look for any entries related to the affected user.

![IntuneSetup](/src/assets/Troubleshooting/Enrollment_Error/IntuneErrorDetails.png)

**Step 2: Verify Device Type Restrictions**

The error may be caused by device type restrictions that block macOS devices from enrolling. 
To check and modify these settings:

1. In the Intune portal, go to Devices > Enrollment.
2. Click on Apple.
3. Select Device platform restrictions and switch to the macOS restrictions tab.

**Step 3: Adjust Restrictions**

1. Review the existing device restrictions to ensure that macOS devices are allowed to enroll.
2. If multiple restrictions exist, examine each one to confirm that the macOS platform is permitted.
3. To modify a restriction, go to its Properties and check the Platform settings.
4. Ensure that macOS devices are not blocked and are allowed to enroll.

By following these steps, you can identify and resolve the issue preventing macOS device enrollment in Intune. 
This process ensures that your device type restrictions are appropriately configured to support macOS devices.
