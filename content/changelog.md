---
description: "A transparent record of what changed across IntuneMacAdmins, when it changed, where it was published, and which sources support it."
---

# Changelog

Every meaningful documentation change, in one place. Each entry shows what was added or corrected, the page that changed, and the authoritative source behind it.

<a href="home/whats-new.md" class="button primary">See the Latest Intune Updates</a> <a href="home/how-to-contribute.md" class="button secondary">Contribute a Change</a>

{% hint style="info" %}
**Transparent by design.** Content updates and verified corrections are written here by the same automation that updates the docs. A changelog entry is included in the pull request and passes the same validation and preview checks before publication.
{% endhint %}

<!-- changelog:entries -->

## July 14, 2026

<!-- changelog-entry:db5086e2aee1c5e6 -->
### The changelog moved to the main website

**Site update** · Maintainer published

Published the source-linked changelog at `www.intunemacadmins.com/changelog`, added a Changelog button to the main landing page that opens in a new tab, and connected the static page to the same automated changelog source used by the documentation workflows.

- **Published to:** [Main website changelog](https://www.intunemacadmins.com/changelog/), [IntuneMacAdmins landing page](https://www.intunemacadmins.com/)
- **Source:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)

---

<!-- changelog-entry:transparent-changelog-launch -->
### A transparent changelog moved to center stage

**Site update** · Maintainer published

Redesigned the old release list as a source-first timeline at `/changelog`, added a landing-page call to action, preserved the historical archive, and connected both documentation workflows so future content and corrections log themselves automatically.

- **Published to:** [Changelog](changelog.md), [IntuneMacAdmins home](README.md)
- **Source:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)

---

<!-- changelog-entry:initial-pkg-update -->
### macOS PKG apps can update automatically

**Content update** · Automatically published

Added Microsoft’s new behavior for available macOS PKG apps. When an admin uploads a newer version with the same bundle ID, previously installed available apps can update without another Company Portal action. The behavior requires Intune management agent version 2606.013 or later.

- **Published to:** [What’s New in Intune](home/whats-new.md)
- **Source:** [Microsoft Intune release notes](https://learn.microsoft.com/en-us/intune/whats-new/#available-macos-pkg-apps-update-automatically-when-you-upload-a-new-version)

---

<!-- changelog-entry:automation-launch -->
### Documentation updates became set-and-forget

**Site update** · Maintainer published

Rebuilt the content and freshness workflows so verified changes update existing pages first, create a well-placed page only when necessary, validate the exact pull request revision, merge automatically, and confirm GitBook and Vercel publication.

- **Published to:** [Documentation repository](https://github.com/ugurkocde/intunemacadmins)
- **Source:** [Automation implementation](https://github.com/ugurkocde/intunemacadmins/commit/607ef62289a5b4827b8b1b4d302a0838b7874da6)

---

<!-- changelog-entry:community-pulse-removal -->
### Community Pulse and Core Contributors were retired

**Site update** · Maintainer published

Removed the Community Pulse category, its generated pages and source collectors, plus the Core Contributors table. Community resources, tools, and the complete contributor list remain available in their established sections.

- **Published to:** [IntuneMacAdmins home](README.md), [Community resources](community/community-resources.md), [Contributors](home/contributors.md)
- **Source:** [Site cleanup](https://github.com/ugurkocde/intunemacadmins/commit/607ef62289a5b4827b8b1b4d302a0838b7874da6)

## Earlier releases

### Version 2.0 · September 2, 2024

**Content update** · Maintainer published

Introduced the Baseline Settings for Intune catalog, covering account security, antivirus, Defender, Edge, FileVault, Gatekeeper, Microsoft AutoUpdate, Office, OneDrive, Platform SSO, restrictions, and software updates.

### Version 1.7 · August 27, 2024

Added Microsoft Defender enrollment, Declarative Device Management, and Rapid Security Response guidance to the Complete Guide to macOS Deployment.

### Version 1.6 · August 23, 2024

Added Troubleshooting Guides, the Enrollment Error page, and Intune Uploader resources.

### Version 1.5 · August 19, 2024

Added page-level feedback, Company Portal LOB deployment guidance, and the managed-device user experience guide.

### Version 1.4 · August 8, 2024

Launched the Complete Guide to macOS Deployment with Apple Business Manager, Intune integration, device enrollment, Platform SSO, and FileVault setup guidance.

### Version 1.3 · August 2, 2024

Added the Snippets catalog with Packaging and Shortcuts.

### Version 1.2 · July 30, 2024

Expanded the FAQ with practical answers covering APNs, device lifecycle, migration, enrollment, Defender, certificates, custom settings, policy timing, local inspection, monitoring, and release tracking.

### Version 1.1 · July 29, 2024

Added the Intune Getting Started Guide, prerequisites, and basic tenant setup.

### Version 1.0.2 · July 25, 2024

Added the What’s New in Intune page and guidance for enrolling a Mac without Apple Business Manager.

### Version 1.0.1 · July 17, 2024

Corrected navigation and page titles and added the Root3 Support App.

### Version 1.0 · July 15, 2024

Published the first guides for Await Final Configuration, Custom Attributes, Declarative Device Management, FileVault, OneDrive Known Folder Move, Platform SSO, file deployment, and Microsoft app updates.
