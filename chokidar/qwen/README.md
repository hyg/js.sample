# Nextcloud Note Sync

This tool automatically creates and synchronizes markdown notes with a Nextcloud server.

## Features

- Creates 4 note files daily with the naming pattern `d.YYYYMMDD.XX.md`
- Automatically uploads notes to Nextcloud and creates public read-only shares
- Watches for local file changes and syncs updates to Nextcloud
- On shutdown (Ctrl+C): 
  - Removes all shares
  - Combines notes into a daily summary file
  - Uploads the summary to Nextcloud with a public share

## Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Copy `config.json.example` to `config.json` and update with your Nextcloud credentials:
   ```json
   {
     "nextcloudUrl": "https://your-nextcloud-instance.com",
     "username": "your-username",
     "password": "your-app-password",
     "localNoteDir": "./notes"
   }
   ```
4. Run the tool with `node index.js`

## Usage

After starting the tool, 4 note files will be created in your specified local directory with the following naming pattern:
- d.YYYYMMDD.01.md
- d.YYYYMMDD.02.md
- d.YYYYMMDD.03.md
- d.YYYYMMDD.04.md

Each file will have a public share URL as its first line. You can share these URLs for read-only access to your notes.

When you're done for the day, press `Ctrl+C` to shut down the tool. It will automatically:
1. Remove all individual note shares
2. Create a daily summary file combining all notes
3. Upload the summary to Nextcloud
4. Create a public share for the summary file
5. Display the summary share URL in the console

## Dependencies

- [nextcloud-node-client](https://github.com/nextcloud/nextcloud-node-client) - For interacting with Nextcloud
- [chokidar](https://github.com/paulmillr/chokidar) - For watching file changes

## License

MIT