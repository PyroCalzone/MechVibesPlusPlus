const Store = require('electron-store');
const store = new Store();

class startupHandler {
  constructor(app) {
    this.app = app;
    this.MV_MOUSESOUNDS_LSID = 'mechvibes-mouse';
  }

  get is_mousesounds() {
    return store.get(this.MV_MOUSESOUNDS_LSID);
  }

  enable() {
    store.set(this.MV_MOUSESOUNDS_LSID, true);
  }

  disable() {
    store.set(this.MV_MOUSESOUNDS_LSID, false);
  }

  toggle() {
    if (this.is_mousesounds) {
      this.disable();
    } else {
      this.enable();
    }
  }
}

module.exports = startupHandler;
