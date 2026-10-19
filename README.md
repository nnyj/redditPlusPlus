# Reddit++

A script that enhances the new Reddit interface and provides flexible customization options.

<details>
    <summary>🗨️ Feed page</summary>
    <img width="820" src="https://raw.githubusercontent.com/lnm95/redditPlusPlus/main/public/screenshots/readme/feed.png" alt="Feed page">
</details>

<details>
    <summary>💬 Comments page</summary>
    <img width="820" src="https://raw.githubusercontent.com/lnm95/redditPlusPlus/main/public/screenshots/readme/comments.png" alt="Comments page">
</details>

<details>
    <summary>⚙️ The script settings</summary>
    <img width="820" src="https://raw.githubusercontent.com/lnm95/redditPlusPlus/main/public/screenshots/readme/settings.png" alt="The script settings">
</details>

## Usage

1. Install `Tampermonkey`, `Violentmonkey` or any other userscript manager.
2. Go to [the script homepage](https://greasyfork.org/en/scripts/490046-reddit) and click **Install**.

## RES layout

This copy of Reddit++ adds an `RES layout` module, old Reddit with RES night mode on new Reddit. Upstream Reddit++ is by [lnm95](https://github.com/lnm95/redditPlusPlus).

- **Install:**
  - Install [redditPlusPlus.user.js](https://github.com/nnyj/redditPlusPlus/releases/latest/download/redditPlusPlus.user.js) from the latest release.
  - It installs as `Reddit++ RES`, disable upstream Reddit++ first.
  - One `RES layout` toggle in Reddit++ settings, on by default.

- **Comments:**
  - 5px depth bars, click one to collapse its comment.
  - Thread roots end in a 2px dark red line.
  - Score shown as `N points`, avatars and thread lines hidden.
  - Action row faint until hovered, in-thread ads hidden.

- **Feed:**
  - 48px rows: votes, thumbnail, title, one meta line of actions.
  - Thumbnail or `preview` shows post media inline, galleries included.
  - Banner, highlights and related communities hidden.
  - Reddit++ `Soft background` skipped.

- **Sidebar:**
  - Slides out from a 30px strip at the right edge.
  - "People also ask" and related posts hidden, wide mode skipped.
  - Logged out, the left sign-up panel is hidden.

- **Theme:**
  - Dark theme only, grays replace Reddit's blue-green tones.
  - Colors and feed styles load at script start.

### Maintenance notes

- `shreddit-comment` has no shadow root, document styles reach it.
- Feed `shreddit-post` renders the RES row in its `full-post-link` shadow slot.
- Votes, save, hide, report and preview click the hidden native buttons.

## Development

[That template](https://github.com/trim21/webpack-userscript-template) is used for the project.

### Getting started

Using `Visual Studio Code` is recommended.

Required `Node.js`.

Run `npm i` to install dependencies.

### Debug

Run `npm run debug` to start debug process.

Add generated script wrapper `redditPlusPlus.dev.user.js` from `/dist` to userscript manager.

Allow local files for userscript manager (extensions > details > allow access to file URLs).

Chrome requires allowing Eval (Tampermonkey Dashboard > Settings > Modify existing content security policy (CSP) headers > remove entirely).

While the debug process is running, the script will automatically refresh in the browser.

To stop the debug process, kill the active terminal.

### Build

Run `npm run build` to build the release version in `/dist`.

### Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.
