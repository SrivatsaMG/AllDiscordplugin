/**
 * @name BetterSpotifyEmbed
 * @author Ahlawat
 * @authorId 1025214794766221384
 * @version 1.0.0
 * @invite SgKSKyh9gY
 * @description Adds options to Spotify embeds to play a song immediately or add it to the queue.
 * @website https://tharki-god.github.io/
 * @source https://github.com/Tharki-God/BetterDiscordPlugins
 * @updateUrl https://tharki-god.github.io/BetterDiscordPlugins/BetterSpotifyEmbed.plugin.js
 */
/*@cc_on
@if (@_jscript)
var shell = WScript.CreateObject("WScript.Shell");
var fs = new ActiveXObject("Scripting.FileSystemObject");
var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
var pathSelf = WScript.ScriptFullName;
shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
} else if (!fs.FolderExists(pathPlugins)) {
shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
} else if (shell.Popup("Should I move myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
fs.MoveFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)));
shell.Exec("explorer " + pathPlugins);
shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
}
WScript.Quit();
@else@*/
module.exports = (() => {
    const config = {
      info: {
        name: "BetterSpotifyEmbed",
        authors: [
          {
            name: "Ahlawat",
            discord_id: "1025214794766221384",
            github_username: "Tharki-God",
          },
        ],
        version: "1.0.0",
        description: "Adds options to Spotify embeds to play a song immediately or add it to the queue.",
        github: "https://github.com/Tharki-God/BetterDiscordPlugins",
        github_raw:
          "https://tharki-god.github.io/BetterDiscordPlugins/BetterSpotifyEmbed.plugin.js",
      },
      changelog: [
        {
          title: "v0.0.1",
          items: ["Idea in mind"],
        },
        {
          title: "v0.0.5",
          items: ["Base Model"],
        },
        {
          title: "Initial Release v1.0.0",
          items: [
            "This is the initial release of the plugin :)",
            "Makes it easier to play on spotify",
          ],
        },
      ],
      main: "BetterSpotifyEmbed.plugin.js",
    };
    const RequiredLibs = [{
      window: "ZeresPluginLibrary",
      filename: "0PluginLibrary.plugin.js",
      external: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
      downloadUrl: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js"
    },
    {
      window: "BunnyLib",
      filename: "1BunnyLib.plugin.js",
      external: "https://github.com/Tharki-God/BetterDiscordPlugins",
      downloadUrl: "https://tharki-god.github.io/BetterDiscordPlugins/1BunnyLib.plugin.js"
    },
    ];
    class handleMissingLibrarys {
      load() {
        for (const Lib of RequiredLibs.filter(lib => !window.hasOwnProperty(lib.window)))
          BdApi.showConfirmationModal(
            "Library Missing",
            `The library plugin (${Lib.window}) needed for ${config.info.name} is missing. Please click Download Now to install it.`,
            {
              confirmText: "Download Now",
              cancelText: "Cancel",
              onConfirm: () => this.downloadLib(Lib),
            }
          );
      }
      async downloadLib(Lib) {
        const fs = require("fs");
        const path = require("path");
        const { Plugins } = BdApi;
        const LibFetch = await fetch(
          Lib.downloadUrl
        );
        if (!LibFetch.ok) return this.errorDownloadLib(Lib);
        const LibContent = await LibFetch.text();
        try {
          await fs.writeFile(
            path.join(Plugins.folder, Lib.filename),
            LibContent,
            (err) => {
              if (err) return this.errorDownloadLib(Lib);
            }
          );
        } catch (err) {
          return this.errorDownloadLib(Lib);
        }
      }
      errorDownloadZLib(Lib) {
        const { shell } = require("electron");
        BdApi.showConfirmationModal(
          "Error Downloading",
          [
            `${Lib.window} download failed. Manually install plugin library from the link below.`,
          ],
          {
            confirmText: "Download",
            cancelText: "Cancel",
            onConfirm: () => {
              shell.openExternal(
                Lib.external
              );
            },
          }
        );
      }
      start() { }
      stop() { }
    }
    return RequiredLibs.some(m => !window.hasOwnProperty(m.window))
      ? handleMissingLibrarys
      : (([Plugin, ZLibrary]) => {
        const {
          PluginUpdater,
          Logger,
          Patcher,
          DOMTools,
          Utilities,
          Settings: { SettingPanel, Switch },
          DiscordModules: { React, Tooltip },
        } = ZLibrary;
        const { 
            LibraryIcons,
             SpotifyApi,
              LibraryModules: { Embed }
             } = BunnyLib.build(config);
        const CSS = `
          .spotifyEmbedWrapper > :not(iframe) {
            opacity: 0% !important;
            transition: all 0.2s ease-in-out;
          }      
          .spotifyEmbedWrapper:hover > :not(iframe) {
            opacity: 100% !important;
          }
          `
        const defaultSettings = {
          showToast: true,
        };
        return class BetterSpotifyEmbed extends Plugin {
          constructor() {
            super();
            this.settings = Utilities.loadData(
              config.info.name,
              "settings",
              defaultSettings
            );
          }
          checkForUpdates() {
            try {
              PluginUpdater.checkForUpdate(
                config.info.name,
                config.info.version,
                config.info.github_raw
              );
            } catch (err) {
              Logger.err("Plugin Updater could not be reached.", err);
            }
          }
          start() {
            this.checkForUpdates();
            this.applyEmbedPatch();
            DOMTools.addStyle(config.info.name, CSS);
          }
          applyEmbedPatch() {
            Patcher.after(Embed, 'render', (_, args, res) => {
              if (res?.props?.embed?.provider?.name !== "Spotify" || !SpotifyApi.getAccessToken()) return;
              Patcher.after(res, "type", (_, args, res) => {
                const { url, rawTitle: title } = args[0].embed;
                const [, , type, id] = url.match(/(https?:\/\/)?open.spotify.com\/(album|track|playlist)\/([^?]+)/) ?? [];
                if (!type || !id) return res;
                const uri = `spotify:${type}:${id}`;
                return React.createElement("div", {
                  className: "spotifyEmbedWrapper",
                  style: {
                    color: "#FFFFFF",
                  }
                }, res, this.queueButton({ uri, title }),
                  this.playButton({ uri, title, addToQueue: type === 'track' })
                )
              })
            })
          }
          playButton({ uri, title, addToQueue }) {
            return React.createElement(
              Tooltip,
              {
                text: "Play now",
              },
              (props) =>
                React.createElement("span", {
                  ...props,
                  onClick: () => SpotifyApi.play({ title, uri, addToQueue, showToast: this.settings["showToast"] }),
                  className: "playOnSpotify",
                  style: {
                    cursor: "pointer",
                    position: "absolute",
                    top: "25px",
                    stroke: "#646464",
                    strokeWidth: "1px"
                  }
                }, LibraryIcons.Play("22", "22"))
            );
          }
          queueButton({ title, uri }) {
            return React.createElement(
              Tooltip,
              {
                text: "Add to Queue",
              },
              (props) =>
                React.createElement("span", {
                  ...props,
                  onClick: () => SpotifyApi.addToQueue({ title, uri, showToast: this.settings["showToast"] }),
                  className: "addToQueue",
                  style: {
                    cursor: "pointer",
                    position: "absolute",
                    top: "5px",
                    stroke: "#646464",
                    strokeWidth: "1px"
                  }
                }, LibraryIcons.QueueAdd("22", "22"))
            );
          }
          onStop() {
            Patcher.unpatchAll();
            DOMTools.removeStyle(config.info.name);
          }
          getSettingsPanel() {
            return SettingPanel.build(
              this.saveSettings.bind(this),
              new Switch(
                "Pop-up/Toast",
                "Get a confirmation/error message when playing/queueing songs.",
                this.settings["showToast"],
                (e) => {
                  this.settings["showToast"] = e;
                }
              )
            )
          }
          saveSettings() {
            Utilities.saveData(config.info.name, "settings", this.settings);
          }
        };
      })(ZLibrary.buildPlugin(config));
  })();
    /*@end@*/
  