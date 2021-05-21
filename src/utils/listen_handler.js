const Store = require('electron-store');
const store = new Store();

class startupHandler {
  constructor(app) {
    this.app = app;
    this.MV_MUTED_LSID = 'mechvibes-muted';
    this.MV_KEYUP_LSID = 'mechvibes-keyup';
  }

  get is_muted() {
    return store.get(this.MV_MUTED_LSID);
  }

  get is_keyup() {
    return store.get(this.MV_KEYUP_LSID);
  }

  enable() {
    store.set(this.MV_MUTED_LSID, true);
  }

  enableKeyup() {
    store.set(this.MV_KEYUP_LSID, true);
  }

  disable() {
    store.set(this.MV_MUTED_LSID, false);
  }

  disableKeyup() {
    store.set(this.MV_KEYUP_LSID, false);
  }

  toggle() {
    if (this.is_muted) {
      this.disable();
    } else {
      this.enable();
    }
  }

  toggleKeyup() {
    if (this.is_keyup) {
      this.disableKeyup();
    } else {
      this.enableKeyup();
    }
  }
}

module.exports = startupHandler;
