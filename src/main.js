// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { resolve, join } = require("path");
const StartupHandler = require("./utils/startup_handler");
const ListenHandler = require("./utils/listen_handler");
const KeyupHandler = require("./utils/keyup_handler");
const MouseHandler = require("./utils/mouse_handler");
const RandomHandler = require("./utils/random_handler");

const SYSTRAY_ICON = path.join(__dirname, "/assets/system-tray-icon.png");
const home_dir = app.getPath("home");
const keyboardcustom_dir = path.join(home_dir, "/mechvibes_custom");
const mousecustom_dir = path.join(home_dir, "/mousevibes_custom");

const Store = require("electron-store");
Store.initRenderer();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var tray = null;
// create custom sound folder if not exists
fs.ensureDirSync(keyboardcustom_dir);
fs.ensureDirSync(mousecustom_dir);

function createWindow(show = true) {
  // Create the browser window.
  win = new BrowserWindow({
    // 450
    width: 1200,
    height: 730,
    webSecurity: false,
    // resizable: false,
    // fullscreenable: false,
    webPreferences: {
      preload: resolve(__dirname, "app.js"),
      // contextIsolation: true,
      nodeIntegration: true,
      sandbox: false,
    },
    show,
  });

  // remove menu bar
  win.removeMenu();

  // and load the index.html of the app.
  win.loadFile("./src/app.html").then(() => {
    // global.app_version = app.getVersion();
    // global.keyboardcustom_dir = keyboardcustom_dir;
    // global.mousecustom_dir = mousecustom_dir;
    console.log(mousecustom_dir);
    console.log(keyboardcustom_dir);
    win.webContents.send("main:appVersion", app.getVersion());
    win.webContents.send("main:mouseCustomDirectory", mousecustom_dir);
    win.webContents.send("main:keyboardCustomDirectory", keyboardcustom_dir);
  });

  // Open the DevTools.
  win.openDevTools();
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.on("minimize", function (event) {
    if (process.platform === "darwin") {
      app.dock.hide();
    }
    event.preventDefault();
    win.hide();
  });

  win.on("close", function (event) {
    if (!app.isQuiting) {
      if (process.platform === "darwin") {
        app.dock.hide();
      }
      event.preventDefault();
      win.hide();
    }
    return false;
  });

  return win;
}

const gotTheLock = app.requestSingleInstanceLock();
app.on("second-instance", () => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    win.show();
    win.focus();
  }
});

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      win.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Don't show the window and create a tray instead
  // create and get window instance
  app.on("ready", () => {
    win = createWindow(true);

    // start tray icon
    tray = new Tray(SYSTRAY_ICON);

    // tray icon tooltip
    tray.setToolTip("MechvibesPlusPlus");

    const startup_handler = new StartupHandler(app);
    const listen_handler = new ListenHandler(app);
    const keyup_handler = new KeyupHandler(app);
    const mouse_handler = new MouseHandler(app);
    const random_handler = new RandomHandler(app);

    // context menu when hover on tray icon
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "MechvibesPlusPlus",
        click: function () {
          // show app on click
          win.show();
        },
      },
      {
        label: "Editor",
        click: function () {
          openEditorWindow();
        },
      },
      {
        label: "Keyboard Sound Custom Folder",
        click: function () {
          shell.openItem(keyboardcustom_dir);
        },
      },
      {
        label: "Mouse Sound Custom Folder",
        click: function () {
          shell.openItem(mousecustom_dir);
        },
      },
      {
        label: "Open Devtools",
        click: function () {
          win.openDevTools();
          win.webContents.openDevTools();
        },
      },
      {
        label: "Refresh Soundpacks",
        click: function () {
          win.webContents.send("refresh");
        },
      },
      {
        label: "Mute",
        type: "checkbox",
        checked: listen_handler.is_muted,
        click: function () {
          listen_handler.toggle();
          win.webContents.send("muted", listen_handler.is_muted);
        },
      },
      {
        label: "Keyup Sounds",
        type: "checkbox",
        checked: keyup_handler.is_keyup,
        click: function () {
          keyup_handler.toggle();
          win.webContents.send("theKeyup", keyup_handler.is_keyup);
        },
      },
      {
        label: "Mouse Sounds",
        type: "checkbox",
        checked: mouse_handler.is_mousesounds,
        click: function () {
          mouse_handler.toggle();
          win.webContents.send("MouseSounds", mouse_handler.is_mousesounds);
        },
      },
      {
        label: "Random Sounds",
        type: "checkbox",
        checked: random_handler.is_random,
        click: function () {
          random_handler.toggle();
          win.webContents.send("RandomSoundEnable", random_handler.is_random);
        },
      },
      {
        label: "Enable at Startup",
        type: "checkbox",
        checked: startup_handler.is_enabled,
        click: function () {
          startup_handler.toggle();
        },
      },
      {
        label: "Quit",
        click: function () {
          // quit
          app.isQuiting = true;
          app.quit();
        },
      },
    ]);

    // double click on tray icon, show the app
    tray.on("double-click", () => {
      win.show();
    });

    tray.setContextMenu(contextMenu);

    // prevent Electron app from interrupting macOS system shutdown
    if (process.platform == "darwin") {
      const { powerMonitor } = require("electron");
      powerMonitor.on("shutdown", () => {
        app.quit();
      });
    }
  });
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow();
});

// always be sure that your application handles the 'quit' event in your main process
app.on("quit", () => {
  app.quit();
});

var editor_window = null;

function openEditorWindow() {
  if (editor_window) {
    editor_window.focus();
    return;
  }

  editor_window = new BrowserWindow({
    width: 1200,
    height: 600,
    // resizable: false,
    // minimizable: false,
    // fullscreenable: false,
    // modal: true,
    // parent: win,
    webPreferences: {
      // preload: path.join(__dirname, 'editor.js'),
      nodeIntegration: true,
    },
  });

  // editor_window.openDevTools();

  editor_window.loadFile("./src/editor.html");

  editor_window.on("closed", function () {
    editor_window = null;
  });
}
