---
title: Configure Await Final Configuration

---

**Intune Configuration**

- In the Intune admin center, go to **Devices** > **Enrollment**.
- Select the **Apple** tab.
- Under **Bulk Enrollment Methods**, select **Enrollment program tokens**.
- Select an enrollment program token.
- Select **Profiles** > **Create profile** > **macOS**
  ![Await Final Configuration](/src/assets/AFC/afc-config1.png)

- Enter a name and description for the profile so that you can distinguish it from other enrollment profiles.
- On the **Management Settings** page, configure **Enrol with User Affinity & Modern Authentication.**

<Aside>
💡 Await Final Configuration & Managed Local Accounts can only be used with User Affinity & Modern Authentication.
</Aside>


- Toggle "Yes" for Await Final Configuration and click Next
  ![Await Final Configuration](/src/assets/AFC/afc-config2.png)

- On the **Setup Assistant** page, configure the Setup Assistant experience as per your organisation requirements.
- On the Account Settings page, Select **Yes** to create local managed account during enrollment.

![Await Final Configuration](/src/assets/AFC/afc-config3.png)

- Toggle "Yes" for blocking users to change their username details.

- Review changes and click **Create** to finish creating the profile.


**Conclusion**

The “Await Final Configuration” state is a powerful feature in Apple Device Management that ensures devices are properly configured and compliant before they are used. By using the Release Device from Await Configuration API endpoint, administrators can efficiently manage and transition devices to their operational state, maintaining security and compliance within their organization.

For more detailed information, you can refer to the [Apple Developer Documentation](https://developer.apple.com/documentation/devicemanagement/release_device_from_await_configuration).