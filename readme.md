# logseq-memos-sync (Maintained Fork)

> [!NOTE]  
> This is an actively maintained fork of the original [logseq-memos-sync](https://github.com/eindex/logseq-memos-sync), which was archived by its original author. This fork brings compatibility with newer Memos API versions (v0.26+) and adds new features like attachment synchronization.
---

> A Memos sync plugin for Logseq.

<a href="https://www.buymeacoffee.com/eindex"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=eindex&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" /></a>

*(Support the original author, eindex, for their foundational work)*

## Features

This plugin imports your Memos into Logseq, providing a seamless way to aggregate your quick captures and thoughts in your knowledge base.

- **Multiple Sync Modes**: Choose where your memos land in Logseq:
  - **Journal Grouped** (Default): Appends memos into a designated block (e.g., `#Memos`) on your daily journal page.
  - **Journal**: Appends memos directly to the root of your daily journal page.
  - **Custom Page**: Centralizes all synced memos onto a single custom page.
- **Background & Auto Sync**: Automatically sync when Logseq starts, or fetch in the background on an interval (Minutely to Bi-Hourly).
- **Send to Memos**: Send any Logseq block directly to your Memos server using a slash command.
- **Tag Filtering**: Only sync memos containing specific tags, and sync those tags into Logseq.
- **[NEW] Attachment Support**: Synchronize attachments along with your text. Pick between `Disable`, `Link` (show remote image), or `Download` (save locally to Logseq assets).
- **[NEW] Robust Incremental Sync**: Tracks memos by their creation timestamp to guarantee that no new memos are skipped.
- **Archive on Sync** (Optional): Keep your Memos clean by automatically archiving private memos on the server after they are safely synced to Logseq.

## Configuration

To get started, you need to configure the connection settings in the Logseq **Plugins settings** page:

- **Open API (Host)**: The URL of your Memos server (e.g., `https://memos.example.com`). *Ensure you include the protocol (http/https).*
- **Token**: Your Memos API Token. You can generate this inside your Memos user settings.
- **Mode**: Where to sync memos (as detailed in Features).
- **Memos Inbox Name**: If using `Journal Grouped` mode, this is the block reference where memos are nested (default is `#Memos`).
- **Attachment Sync**: Select how to handle files (`Link`, `Download`, or `Disabled`).
- **Default Visibility for send block to memos**: Crucial if you want to send Logseq blocks *to* Memos. Check the visibility levels (Public, Private, Protected) you want available as slash commands.

*Note: Changes to settings like "Default Visibility" or "Mode" may require you to restart Logseq to take effect.*

## Installation

Since this fork may not be available in the default Logseq Marketplace, you can install it manually:

1. Download the latest release `.zip` file from the [Releases page](https://github.com/hystericalanduseless/logseq-memos-sync/releases).
2. Unzip the downloaded file into a folder.
3. In Logseq, go to **Settings** > **Advanced** and enable **Developer mode**.
4. Go to **Plugins**, click **Load unpacked plugin**, and select the unzipped folder.
5. Open the plugin settings, set up your Memos API domain (including the protocol header, e.g., `https://...`) and your Access Token.

## Usage

### Syncing Memos from Server

**Manual Sync:**
1. Open the Logseq command panel (`Ctrl + Shift + P` on Windows / Linux or `Cmd + Opt + P` on macOS).
2. Search for `Sync Memos` and run it.

**Automatic Sync:**
Check the `Auto Sync` box in settings to fetch immediately when Logseq launches, or set the `Background Sync` interval.

### Sending Logseq Blocks to Memos

You can send a block directly from Logseq to your Memos server:
1. Ensure you have checked at least one visibility option in the plugin setting **Default Visibility for send block to memos** (e.g., "Private"), and restart Logseq.
2. Focus on the block you want to send in Logseq.
3. Type `/memos: Send in Private` (or the respective visibility you checked). 
4. The block's content will instantly be posted to your Memos server!

## Limitations

- If a memo already exists in your Logseq graph, the plugin will not update its content. This is a deliberate design choice to prevent overwriting your local edits.
- **Memos API Attachment Limitation**: According to the [Memos API Documentation](https://usememos.com/docs/api/attachmentservice/CreateAttachment), the `content` of an attachment is "Input only". Therefore, for local file attachments without an `externalLink`, the plugin cannot fetch the file content from the server into Logseq.


## Troubleshooting / Self-Checking

If you find that data is not syncing properly, please check the following:

- **Server Reachability:** Make sure your Memos server is online and accessible.
- **Property Indexing:** Ensure that the `memo-id` property is properly indexed in your Logseq graph. The plugin uses this property to track synced memos. You can verify this by running the following query in Logseq; it should return results if you have previously synced memos:
  `{{query (or (property memoid) (property memo-id))}}`
  *If this query returns nothing despite having synced memos, Logseq may have failed to index the property.*

## Acknowledgements

- [Memos](https://github.com/usememos/memos)

