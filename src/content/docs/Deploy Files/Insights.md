---
title: Insights
description: Insights on how to deploy files on macOS devices using Intune.
sidebar:
  order: 2
---

## Security

- **PKG vs. Cloud Storage**: PKGs are more secure than public cloud storage.
  Example: Deploying font files via PKG instead of downloading from a public URL.

- **No Exposed Secrets**: PKGs eliminate the need for credentials in scripts.
  Example: Avoid scripts like `curl -u username:password https://example.com/file.zip`.

## Efficiency

- **Offline Deployment**: PKGs work without internet post-download.
  Example: Deploying large video files that work immediately after installation.

- **Version Control**: Use version numbers in PKG names.
  Example: `CompanyWallpapers_v1.2.pkg`

## User Experience

- **Silent Installation**: PKGs install without user interaction.
  Example: Deploying license files without interrupting user workflow.

## Troubleshooting

- **Logging**: Implement detailed logging in postinstall scripts.
  Example:
  ```bash
  echo "$(date): Copying files to /Library/Company/" >> /var/log/company_deployment.log
  ```

## Best Practices

- **Testing**: Always test in a controlled environment first.
  Example: Deploy to a test group of 5-10 devices before full rollout.

- **File Organization**: Structure content logically within the PKG.
  Example:
  ```
  Content/
  ├── Fonts/
  ├── Wallpapers/
  └── Documents/
  ```

- **Incremental Updates**: Design PKGs to support incremental updates.
  Example: Update only changed files instead of re-deploying the entire package.