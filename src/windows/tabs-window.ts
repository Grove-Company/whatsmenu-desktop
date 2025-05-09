import { WebContentsView, app, ipcMain, screen } from "electron";

import path from "node:path";
import { ProfileType } from "../@types/profile";
import { registerShortCuts } from "../main/shortcuts";
import { store } from "../main/store";
import { create_bot_tab } from "./tabs/bot-tab";
import { create_dashboard_tab } from "./tabs/dashboard-tab";
import { create_menu_tab } from "./tabs/menu-tab";
import { create_pdv_tab } from "./tabs/pdv-tab";
import { TabBrowser } from "../extends/tab-browser";
import { whatsmenu_menu } from "../main/menu";
import { MerchantType } from "../@types/merchant";

let forceClose = false;

export const tabsWindow = {
  forceCloseWindow: () => (forceClose = true),
  createWindow: () => {
    const mainScreen = screen.getPrimaryDisplay();
    const { width, height } = mainScreen.size;

    const window = new TabBrowser({
      tabs: [
        create_dashboard_tab(),
        create_pdv_tab(),
        create_menu_tab(),
        create_bot_tab(),
      ],
      width,
      height,
    });

    window.setMenu(whatsmenu_menu);
    window.maximize();
    const tabGroup = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true,
      },
    });

    tabGroup.setBounds({ x: 0, y: 0, width, height: 42 });
    console.log({
      window: window.getBounds(),
      tabGroup: tabGroup.getBounds(),
      tabs: window.tabs.map((tab) => tab.getBounds()),
    });

    ipcMain.on("setActiveTab", (_, tabIndex) => {
      const profile = store.get("configs.profile") as ProfileType;
      window.tabs.forEach((tab) => {
        tab.setVisible(tab.id === tabIndex);
        if (tabIndex === "pdv") {
          tab.render(profile?.slug, "/pdv");
        }

        if (tabIndex === "menu") {
          tab.render(profile?.slug, "");
        }
      });
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      tabGroup.webContents.loadURL(
        `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/tabs.html`,
      );
    } else {
      tabGroup.webContents.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/tabs.html`,
        ),
      );
    }
    window.setTitle(`WhatsMenu Desktop - ${app.getVersion()}`);

    window.contentView.addChildView(tabGroup);
    window.tabs.forEach((tab) => window.contentView.addChildView(tab));
    tabGroup.webContents.on("did-finish-load", () => {
      const profile = store.get("configs.profile") as ProfileType;
      const merchant = store.get("configs.merchant") as MerchantType;
      tabGroup.webContents.send("onProfileChange", profile);
      tabGroup.webContents.send("onMerchantChange", merchant);
      store.onDidChange("configs", (newValue) => {
        tabGroup.webContents.send("onProfileChange", newValue.profile);
        tabGroup.webContents.send("onMerchantChange", newValue.merchant);
      });
    });

    window.contentView.addChildView(tabGroup);
    window.tabs.forEach((tab) => window.contentView.addChildView(tab));
    tabGroup.webContents.on("did-finish-load", () => {
      const profile = store.get("configs.profile") as ProfileType;
      tabGroup.webContents.send("onProfileChange", profile);
      store.onDidChange("configs", (newValue) => {
        tabGroup.webContents.send("onProfileChange", newValue.profile);
      });
    });

    registerShortCuts(window);
    window.on("close", (e) => {
      if (!forceClose) {
        e.preventDefault();
        window.minimize();
      }
    });

    return window;
  },
};
