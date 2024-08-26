---
title: What is Declarative Device Management?
description: Learn about Declarative Device Management (DDM), its benefits, and how it works on macOS devices.
sidebar:
  order: 1
---
*Declarative Device Management (DDM)* is a revolutionary approach to managing mobile devices that empowers them to be autonomous and proactive. One of the key advantages of DDM is improved performance and scalability. By enabling devices to operate autonomously, devices can proactively perform tasks, make decisions, and adjust configurations based on predefined rules. This not only increases efficiency but also allows for faster response times, especially in large-scale deployments.

Another benefit of DDM is the reduced administrative burden it brings. With traditional device management approaches, administrators often have to manually configure each device individually or rely on scripts and profiles to enforce policies. This can be time-consuming and prone to errors. With DDM, administrators can define configurations once using a declarative data model, which is then applied automatically across all managed devices.

Security is another area where DDM shines. By leveraging predefined rules and configurations, DDM enhances security by ensuring devices adhere to established guidelines. Administrators can define policies related to password complexity, encryption requirements, app installation permissions, network access controls, and more. These policies are enforced automatically by the device itself without requiring constant monitoring or intervention from administrators.

## Understanding Declarative Device Management (DDM)
![Declarative Device Management](/src/assets/DDM/DDM-1.png)

Declarative device management is **an update to the existing protocol for device management that can be used in combination with the existing MDM protocol capabilities**. It allows the device to asynchronously apply settings and report status back to the MDM solution without constant polling

With DDM, administrators define configurations once using the declarative data model, which is then applied automatically across all managed devices. Devices become more intelligent and self-sufficient, capable of adjusting their settings and behavior based on predefined rules. This level of autonomy allows devices to operate efficiently without requiring constant supervision or intervention from administrators.

## Benefits of Declarative Device Management

DDM brings several benefits for IT professionals and Mobile Device Management administrators:

1\. **Improved performance and scalability**: By allowing devices to operate independently and efficiently, DDM improves overall performance and scalability. Devices can proactively perform tasks, adjust configurations, and make decisions based on predefined rules.
2\. **Reduced administrative burden**: With DDM, devices can make decisions and perform tasks without constant supervision from administrators.
3\. **Enhanced security and compliance**: DDM enhances security by enforcing predefined rules and configurations across all managed devices. You can define policies related to password complexity, encryption requirements, app installation permissions, network access controls, and more.

### How Declarative Device Management Works

1\. **Declarations**
    Declarations are a fundamental aspect of Apple Declarative Device Management. They serve as the building blocks that enable devices to apply logic autonomously. A declaration is a configuration item that specifies a desired state or behavior for a device. It can include settings, restrictions, or even custom actions.

2\. **Status Channel**
    The status channel plays a crucial role in facilitating communication between devices and the MDM server in Declarative Device Management. It serves as a bidirectional channel through which devices can report their current state and receive updates from the server.

When a device receives declarations from the MDM server, it periodically sends status updates to inform the server about its compliance with those declarations. This continuous feedback loop ensures that administrators have real-time visibility into device status and can take appropriate actions if deviations occur.

3\. **Extensibility**
    Extensibility is another key pillar of Declarative Device Management, offering flexibility and customization options for organizations. It allows for integration with other systems and services, enabling administrators to leverage existing infrastructure and workflows.

The flow below shows you when a device is already enrolled in MDM and you activate Declarative Management:
![Declarative Device Management](/src/assets/DDM/DDM-2.png)

This flow shows you after your activation completes and a CheckIn request occurs:
![Declarative Device Management](/src/assets/DDM/DDM-3.png)

Declarative Device Management (DDM) is a revolutionary approach that empowers mobile devices to operate autonomously and proactively. By allowing devices to make decisions based on predefined rules, DDM improves performance, scalability, and security.