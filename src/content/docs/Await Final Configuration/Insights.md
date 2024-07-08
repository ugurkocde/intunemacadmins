---
title: Insights
sidebar:
  order: 3
---

### API Endpoint: Release Device from Await Configuration

To release a device from the “Await Final Configuration” state, Apple provides a specific API endpoint that allows administrators to transition the device to a fully operational state. This process involves sending a command to the device to finalize its configuration.

Apple’s Device Management API includes the Release Device from Await Configuration endpoint, which is crucial for managing devices in this state. Here’s a high-level overview of how it works:

1. **Endpoint URL**: The specific API endpoint to release a device is:

```
<https://developer.apple.com/documentation/devicemanagement/release_device_from_await_configuration>
```
2. **HTTP Method**: The request method used is POST.

3. **Parameters**:

• device_id: The unique identifier of the device to be released.

• authorization_token: A valid token to authenticate the request.

4. **Response**:

• A successful response indicates that the device has been released from the “Await Final Configuration” state and is now fully operational.

**Example Usage**

Here’s an example of how the API call can be made:

```
POST /v1/devices/{device_id}/release

Host: api.apple.com

Authorization: Bearer {authorization_token}

Content-Type: application/json

{

"device_id": "12345-ABCDE",

"release_type": "final"

}
```