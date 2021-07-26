const Store = require('electron-store');
const store = new Store();

class startupHandler {
  constructor(app) {
    this.app = app;
    this.MV_RANDOM_LSID = 'mechvibes-random';
  }

  get is_random() {
    return store.get(this.MV_RANDOM_LSID);
  }

  enable() {
    store.set(this.MV_RANDOM_LSID, true);
  }

  disable() {
    store.set(this.MV_RANDOM_LSID, false);
  }

  toggle() {
    if (this.is_random) {
      this.disable();
    } else {
      this.enable();
    }
  }
}

module.exports = startupHandler;
