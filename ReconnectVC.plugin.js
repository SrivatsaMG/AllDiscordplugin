/**
 * @name ReconnectVC
 * @author Ahlawat
 * @authorId 1025214794766221384
 * @version 1.3.0
 * @invite SgKSKyh9gY
 * @description Attempts to disconnect from / rejoin a voice chat if the ping goes above a certain threshold.
 * @website https://tharki-god.github.io/
 * @source https://github.com/Tharki-God/BetterDiscordPlugins
 * @updateUrl https://tharki-god.github.io/BetterDiscordPlugins/ReconnectVC.plugin.js
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
module.exports = ((_) => {
	const config = {
	  info: {
		name: "ReconnectVC",
		authors: [
		  {
			name: "Ahlawat",
			discord_id: "1025214794766221384",
			github_username: "Tharki-God",
		  },
		],
		version: "1.3.0",
		description:
		  "Attempts to disconnect from / rejoin a voice chat if the ping goes above a certain threshold.",
		github: "https://github.com/Tharki-God/BetterDiscordPlugins",
		github_raw:
		  "https://tharki-god.github.io/BetterDiscordPlugins/ReconnectVC.plugin.js",
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
			"Teri Mummy Meri Hoja (^///^)",
		  ],
		},
		{
		  title: "v1.2.0",
		  items: ["Fixed issues with disconnecting from vc"],
		},
	  ],
	  main: "ReconnectVC.plugin.js",
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
		  for (const Lib of RequiredLibs.filter(lib =>  !window.hasOwnProperty(lib.window)))
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
			Utilities,
			PluginUpdater,
			Logger,
			Patcher,
			Settings: { SettingPanel, Slider },
			DiscordModules: { ChannelActions, SelectedChannelStore },
		  } = ZLibrary;
		  const { LibraryModules: { RTCConnectionUtils } } = BunnyLib.build(config);
		  const defaultSettings = {
			PingThreshold: 500,
		  };
		  return class ReconnectVC extends Plugin {
			constructor() {
			  super();
			  this.settings = Utilities.loadData(
				config.info.name,
				"settings",
				defaultSettings
			  );
			  this.pingCheckEnabled = true;
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
			  this.addPatch();
			}
			addPatch() {
			  Patcher.after(RTCConnectionUtils, "getLastPing", (_, args, res) => {
				if (!res || res < this.settings["PingThreshold"]) return;
				Logger.warn(
				  `Ping higher than set threshold! Attempting to rejoin VC. ${res} > ${this.settings["PingThreshold"]}`
				);
				ChannelActions.disconnect({
				  voiceID: SelectedChannelStore.getVoiceChannelId(),
				  reconnect: true,
				});
			  });
			  Patcher.after(ChannelActions, "disconnect", (_, [args], res) => {
				if (args?.reconnect)
				  ChannelActions.selectVoiceChannel(args.voiceID);
			  });
			}
			onStop() {
			  Patcher.unpatchAll();
			}
			getSettingsPanel() {
			  return SettingPanel.build(
				this.saveSettings.bind(this),
				new Slider(
				  "Ping Threshold",
				  "The threshold at which the plugin should try to rejoin a voice chat.",
				  300,
				  5000,
				  this.settings["PingThreshold"],
				  (e) => {
					this.settings["PingThreshold"] = e;
				  },
				  {
					markers: [300, 500, 1000, 4999],
					stickToMarkers: false,
					onValueRender: (value) => {
					  return `${Math.floor(value)} ms`;
					},
					onMarkerRender: (value) => {
					  return `${Math.floor(value)} ms`;
					},
				  }
				)
			  );
			}
			saveSettings() {
			  Utilities.saveData(config.info.name, "settings", this.settings);
			}
		  };
		})(ZLibrary.buildPlugin(config));
  })();
  /*@end@*/
  