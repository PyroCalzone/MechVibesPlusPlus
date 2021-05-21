const Store = require('electron-store');
const store = new Store();

class startupHandler {
  constructor(app) {
    this.app = app;
    this.MV_KEYUP_LSID = 'mechvibes-keyup';
  }

  get is_keyup() {
    return store.get(this.MV_KEYUP_LSID);
  }

  enable() {
    store.set(this.MV_KEYUP_LSID, true);
  }

  disable() {
    store.set(this.MV_KEYUP_LSID, false);
  }

  toggle() {
    if (this.is_keyup) {
      this.disable();
    } else {
      this.enable();
    }
  }
}

module.exports = startupHandler;
