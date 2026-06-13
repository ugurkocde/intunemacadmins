---
description: "Collection of snippets like short commands or steps for packaging."
---

# Packaging

Collection of snippets like short commands or steps for packaging.

## Convert .app to .pkg

1. Download and install latest [quickpkg release](https://github.com/scriptingosx/quickpkg/releases/latest).
2. Make quickpkg file executable: chmod 755 ./quickpkg
3. Build pkg: `quickpkg /Applications/MyApp.app --output MyApp.pkg`

## Convert .app to .dmg

1. Create an empty folder and copy the .app file into it.
2. Start Disk Utility and choose File > New Image > Image from Folder.
3. Select the newly created folder.
4. Enter a name for your .dmg file and save it.

## Start app from unverified publisher

1. Start app. Error message appears.
2. Go to System Preferences > Security & Privacy > General.
3. Application should be visible and can be added as exception.

## Get Bundle IDs
... from native apps (like Mail: com.apple.mail) and third-party

Via Finder:

1. Open Applications via Finder.
2. Right-click on the required application and select "Show Packaged Contents".
3. Open the contents folder of application.
4. Open the info.plist file and search for bundle ID (called "CFbundleIdentifier").

Via Terminal:

1. Run `osascript -e 'id of app "Google Drive"'`.
