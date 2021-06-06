'use strict';

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// const gkm = require('gkm');
const Store = require('electron-store');
const store = new Store();
const { Howl } = require('howler');
const { shell, remote, ipcRenderer } = require('electron');
const glob = require('glob');
const iohook = require('iohook');
const path = require('path');
const { platform } = process;
const remapper = require('./utils/remapper');

// Now for the annoying part :|

const MV_KEYBOARD_PACK_LSID = 'mechvibes-pack';
const MV_MOUSE_PACK_LSID = 'mechvibes-mousepack';
const MV_VOL_LSID = 'mechvibes-volume';

const KEYBOARD_CUSTOM_PACKS_DIR = remote.getGlobal('keyboardcustom_dir');
const KEYBOARD_OFFICIAL_PACKS_DIR = path.join(__dirname, 'keyboardaudio');
const MOUSE_CUSTOM_PACKS_DIR = remote.getGlobal('mousecustom_dir');
const MOUSE_OFFICIAL_PACKS_DIR = path.join(__dirname, 'mouseaudio');
const APP_VERSION = remote.getGlobal('app_version');

let current_keyboard_pack = null;
let current_mouse_pack = null;
let current_key_down = null;
let current_mouse_down = null;
let is_muted = store.get('mechvibes-muted') || false;
let is_keyup = store.get('mechvibes-keyup') || true;
let is_mousesounds = store.get('mechvibes-mouse') || true;
const keyboardpacks = [];
const mousepacks = [];
const all_sound_files = {};

// ==================================================
// load all pack
async function loadPacks(status_display_elem, app_body) {
  // init
  status_display_elem.innerHTML = 'Loading...';

  // get all audio folders
  const official_packs = await glob.sync(KEYBOARD_OFFICIAL_PACKS_DIR + '/*/');
  const custom_packs = await glob.sync(KEYBOARD_CUSTOM_PACKS_DIR + '/*/');
  const mouse_official_packs = await glob.sync(MOUSE_OFFICIAL_PACKS_DIR + '/*/');
  const mouse_custom_packs = await glob.sync(MOUSE_CUSTOM_PACKS_DIR + '/*/');
  const folders = [...official_packs, ...custom_packs];
  const mouse_folders = [...mouse_official_packs, ...mouse_custom_packs];

  // get pack data
  folders.map((folder) => {
    // define group by types
    const is_custom = folder.indexOf('mechvibes_custom') > -1 ? true : false;

    // get folder name
    const splited = folder.split('/');
    const folder_name = splited[splited.length - 2];

    // define config file path
    const config_file = `${folder.replace(/\/$/, '')}/config.json`;

    // get pack info and defines data
    const { name, includes_numpad, sound = '', defines, key_define_type = 'single', compatibility = false } = require(config_file);

    // pack sound pack data
    const pack_data = {
      pack_id: `${is_custom ? 'custom' : 'default'}-${folder_name}`,
      group: is_custom ? 'Custom' : 'Default',
      abs_path: folder,
      key_define_type,
      compatibility,
      name,
      includes_numpad,
    };

    // init sound data
    if (key_define_type == 'single') {
      // define sound path
      const sound_path = `${folder}${sound}`;
      const sound_data = new Howl({ src: [sound_path], sprite: keycodesRemap(defines) });
      Object.assign(pack_data, { sound: sound_data });
      all_sound_files[pack_data.pack_id] = false;
      // event when sound loaded
      sound_data.once('load', function () {
        all_sound_files[pack_data.pack_id] = true;
        checkIfAllSoundLoaded(status_display_elem, app_body);
      });
    } else {
      const sound_data = {};
      Object.keys(defines).map((kc) => {
        if (defines[kc]) {
          // define sound path
          const sound_path = `${folder}${defines[kc]}`;
          sound_data[kc] = new Howl({ src: [sound_path] });
          all_sound_files[`${pack_data.pack_id}-${kc}`] = false;
          // event when sound_data loaded
          sound_data[kc].once('load', function () {
            all_sound_files[`${pack_data.pack_id}-${kc}`] = true;
            checkIfAllSoundLoaded(status_display_elem, app_body);
          });
        }
      });
      if (Object.keys(sound_data).length) {
        Object.assign(pack_data, { sound: keycodesRemap(sound_data) });
      }
    }

    // push pack data to pack list
    keyboardpacks.push(pack_data);
  });

  mouse_folders.map((folder) => {
    // define group by types
    const is_custom = folder.indexOf('mousevibes_custom') > -1 ? true : false;

    // get folder name
    const splited = folder.split('/');
    const folder_name = splited[splited.length - 2];

    // define config file path
    const config_file = `${folder.replace(/\/$/, '')}/config.json`;

    // get pack info and defines data
    const { name, sound = '', defines, key_define_type = 'single'} = require(config_file);

    // pack sound pack data
    const pack_data = {
      pack_id: `${is_custom ? 'custom' : 'default'}-${folder_name}`,
      group: is_custom ? 'Custom' : 'Default',
      abs_path: folder,
      key_define_type,
      name,
    };

    // init sound data
    if (key_define_type == 'single') { //This wont work, I still don't give a shit. Maybe??
      // define sound path
      const sound_path = `${folder}${sound}`;
      const sound_data = new Howl({ src: [sound_path], sprite: keycodesRemap(defines) });
      Object.assign(pack_data, { sound: sound_data });
      all_sound_files[pack_data.pack_id] = false;
      // event when sound loaded
      sound_data.once('load', function () {
        all_sound_files[pack_data.pack_id] = true;
        checkIfAllSoundLoaded(status_display_elem, app_body);
      });
    } else {
      const sound_data = {};
      Object.keys(defines).map((kc) => {
        if (defines[kc]) {
          // define sound path
          const sound_path = `${folder}${defines[kc]}`;
          sound_data[kc] = new Howl({ src: [sound_path] });
          all_sound_files[`${pack_data.pack_id}-${kc}`] = false;
          // event when sound_data loaded
          sound_data[kc].once('load', function () {
            all_sound_files[`${pack_data.pack_id}-${kc}`] = true;
            checkIfAllSoundLoaded(status_display_elem, app_body);
          });
        }
      });
      if (Object.keys(sound_data).length) {
        Object.assign(pack_data, { sound: keycodesRemap(sound_data) });
      }
    }

    // push pack data to pack list
    mousepacks.push(pack_data);
  });

  // end load
  return;
}

// ==================================================
// check if all packs loaded
function checkIfAllSoundLoaded(status_display_elem, app_body) {
  Object.keys(all_sound_files).map((key) => {
    if (!all_sound_files[key]) {
      return false;
    }
  });
  status_display_elem.innerHTML = 'Mechvibes++';
  app_body.classList.remove('loading');
  return true;
}

// ==================================================
// remap keycodes from standard to os based keycodes
function keycodesRemap(defines) {
  const sprite = remapper('standard', platform, defines);
  Object.keys(sprite).map((kc) => {
    sprite[`keycode-${kc}`] = sprite[kc];
    delete sprite[kc];
  });
  return sprite;
}

// ==================================================
// get pack by id,
// if id is null,
// get saved pack

var packs = null
function getPack(korm, pack_id = null) {
  if (!pack_id) {
    if (store.get(korm=='keyboard' ? MV_KEYBOARD_PACK_LSID : MV_MOUSE_PACK_LSID)) {
      pack_id = store.get(korm=='keyboard' ? MV_KEYBOARD_PACK_LSID : MV_MOUSE_PACK_LSID);

      if(korm=='keyboard'){
        packs = keyboardpacks;
      }else{
        packs = mousepacks;
      }

      if (!getPack(korm, pack_id)) {
        return packs[0];
      }
    } else {
      return packs[0];
    }
  }
  store.set(korm=='keyboard' ? MV_KEYBOARD_PACK_LSID : MV_MOUSE_PACK_LSID, pack_id);
  return packs.find((pack) => pack.pack_id == pack_id);
}

// ==================================================
// transform pack to select option list
function packsToOptions(packs, pack_list, korm) {
  // get saved pack id
  const selected_pack_id = store.get(korm=='keyboard' ? MV_KEYBOARD_PACK_LSID : MV_MOUSE_PACK_LSID);
  const groups = [];
  packs.map((pack) => {
    const exists = groups.find((group) => group.id == pack.group);
    if (!exists) {
      const group = {
        id: pack.group,
        name: pack.group || 'Default',
        packs: [pack],
      };
      groups.push(group);
    } else {
      exists.packs.push(pack);
    }
  });

  for (let group of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.name;
    for (let pack of group.packs) {
      // check if selected
      const is_selected = selected_pack_id == pack.pack_id;
      if (is_selected) {
        // pack current pack to saved pack
        if(korm=='keyboard'){
          current_keyboard_pack = pack;
        }
        else{
          current_mouse_pack = pack;
        }
      }
      // add pack to pack list
      const opt = document.createElement('option');
      opt.text = pack.name;
      opt.value = pack.pack_id;
      opt.selected = is_selected ? 'selected' : false;
      optgroup.appendChild(opt);
    }
    pack_list.appendChild(optgroup);
  }

  // on select an option
  // update saved list id
  pack_list.addEventListener('change', (e) => {
    const selected_id = e.target.options[e.target.selectedIndex].value;
    store.set(korm=='keyboard' ? MV_KEYBOARD_PACK_LSID : MV_MOUSE_PACK_LSID, selected_id);
    if(korm=='keyboard'){
      current_keyboard_pack = getPack(korm);
    }
    else{
      current_mouse_pack = getPack(korm);
    }
  });
}

// ==================================================
// main
(function (window, document) {
  window.addEventListener('DOMContentLoaded', async () => {
    const version = document.getElementById('app-version');
    const update_available = document.getElementById('update-available');
    const new_version = document.getElementById('new-version');
    const app_logo = document.getElementById('logo');
    const app_body = document.getElementById('app-body');
    const keyboardpack_list = document.getElementById('keyboardpack-list');
    const mousepack_list = document.getElementById('mousepack-list');
    const volume_value = document.getElementById('volume-value-display');
    const volume = document.getElementById('volume');

    // set app version
    version.innerHTML = APP_VERSION;

    // load all packs
    await loadPacks(app_logo, app_body);

    // transform packs to options list
    packsToOptions(keyboardpacks, keyboardpack_list, 'keyboard');
    packsToOptions(mousepacks, mousepack_list, 'mouse');

    // check for new version
    fetch('https://api.github.com/repos/PyroCalzone/MechVibesPlusPlus/releases/latest')
      .then((res) => res.json())
      .then((json) => {
        if (json.tag_name > APP_VERSION) {
          new_version.innerHTML = json.tag_name;
          update_available.classList.remove('hidden');
        }
      });

    // a little hack for open link in browser
    Array.from(document.getElementsByClassName('open-in-browser')).forEach((elem) => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        shell.openExternal(e.target.href);
      });
    });

    // get last selected pack
    current_keyboard_pack = getPack('keyboard');
    current_mouse_pack = getPack('mouse');

    // display volume value
    if (store.get(MV_VOL_LSID)) {
      volume.value = store.get(MV_VOL_LSID);
    }
    volume_value.innerHTML = volume.value;
    volume.oninput = function (e) {
      volume_value.innerHTML = this.value;
      store.set(MV_VOL_LSID, this.value);
    };

    if (!is_muted) {
      iohook.start();
    }

    // listen to key press
    ipcRenderer.on('muted', function (_event, _is_muted) {
      is_muted = _is_muted;
      if (is_muted) {
        iohook.stop();
      } else {
        iohook.start();
      }
    });
    
    var playKeyupSound
    ipcRenderer.on('theKeyup', function (_event, _is_keyup) {
      is_keyup = _is_keyup;
      if (is_keyup) {
        playKeyupSound = true
      } else {
        playKeyupSound = false
      }
    });

    var playMouseSounds
    ipcRenderer.on('MouseSounds', function (_event, _is_mousesounds) {
      is_mousesounds = _is_mousesounds;
      if (is_mousesounds) {
        playMouseSounds = true
      } else {
        playMouseSounds = false
      }
    });


    //This is where I plot to killmyself. :|

    iohook.on('mousedown', ({ button }) => {
      if(playMouseSounds){
        if (current_mouse_down != null && current_mouse_down == button) {
          return;
        }

        current_mouse_down = button;

        const sound_id = `${current_mouse_down}`;

        if (current_mouse_pack) {
          playMouseSound(`${sound_id}`, store.get(MV_VOL_LSID), 'down')
        }
      }
    })

    iohook.on('mouseup', () => {
      if(playMouseSounds){
        playMouseSound(`${current_mouse_down}`, store.get(MV_VOL_LSID), 'up')
      }
      current_mouse_down = null;
    })

    // if key released, clear current key
    iohook.on('keyup', () => {
      if(playKeyupSound){
        playSound(`${current_key_down}`, store.get(MV_VOL_LSID), playKeyupSound, 'up')
      }
      current_key_down = null;
      app_logo.classList.remove('pressed');
    });

    // key pressed, pack current key and play sound
    iohook.on('keydown', ({ keycode }) => {
      // if hold down a key, not repeat the sound
      if (current_key_down != null && current_key_down == keycode) {
        return;
      }

      // display current pressed key
      // app_logo.innerHTML = keycode;
      app_logo.classList.add('pressed');

      // pack current pressed key
      current_key_down = keycode;

      // pack sprite id
      const sound_id = `${current_key_down}`;

      // get loaded audio object
      // if object valid, pack volume and play sound
      if (current_keyboard_pack) {
        if(playKeyupSound){
          playSound(`${current_key_down}`, store.get(MV_VOL_LSID), playKeyupSound, 'down')
        }
        else{
          playSound(sound_id, store.get(MV_VOL_LSID), playKeyupSound, 'null');
        }
      }
    });
  });
})(window, document);

// ==================================================
// universal play function
function playSound(sound_id, volume, playKeyupSound, downOrUp) {

  var initOne
  var initTwo
  const pack_compatibility = current_keyboard_pack.compatibility ? current_keyboard_pack.compatibility : false;
  var keycode = `keycode-${sound_id}`;


      //!Setting keycode correct for compat packs!
      if(playKeyupSound && downOrUp == 'down' && pack_compatibility){
        keycode = `keycode-0${sound_id}`
      }
      else if(playKeyupSound && downOrUp == 'up' && pack_compatibility){
        keycode = `keycode-00${sound_id}`
      }

  const play_type = current_keyboard_pack.key_define_type ? current_keyboard_pack.key_define_type : 'single';
  const sound = play_type == 'single' ? current_keyboard_pack.sound : current_keyboard_pack.sound[keycode];
  if (!sound) {
    return;
  }


      //!!Splitting sound up for non compat packs!! -- DOWN SOUND ONLY
      var tempHoldings
      if(playKeyupSound && !pack_compatibility && downOrUp == 'down'){
        if(play_type == 'single'){
          tempHoldings = sound['_sprite'][keycode]
          initOne = sound['_sprite'][keycode][0] //Start Time
          initTwo = sound['_sprite'][keycode][1] //Length
            sound['_sprite'][keycode][1] = Math.floor(initTwo/2) //Length
        }
        else{
          tempHoldings = sound['_sprite']['__default']
          initOne = sound['_sprite']['__default'][0] //Start Time
          initTwo = sound['_sprite']['__default'][1] //Length
          sound['_sprite']['__default'][1] = Math.floor(initTwo/2) //Length
        }
      }

      else if(playKeyupSound && !pack_compatibility && downOrUp == 'up'){
        if(play_type == 'single'){
          tempHoldings = sound['_sprite'][keycode]
          initOne = sound['_sprite'][keycode][0] //Start Time
          initTwo = sound['_sprite'][keycode][1] //Length
            sound['_sprite'][keycode][0] = initOne+Math.floor((initTwo/2)) //Start Time
            sound['_sprite'][keycode][1] = Math.floor(initTwo/2) //Length
        }
        else{
          tempHoldings = sound['_sprite']['__default']
          initOne = sound['_sprite']['__default'][0] //Start Time
          initTwo = sound['_sprite']['__default'][1] //Length
            sound['_sprite']['__default'][0] = initOne+Math.floor((initTwo/2)) //Start Time
            sound['_sprite']['__default'][1] = Math.floor(initTwo/2) //Length
        }
      }


  sound.volume(Number(volume / 100));
  if (play_type == 'single') {
    sound.play(keycode);
  } else {
    sound.play();
  }

      //Resetting values for non compat packs
      if(playKeyupSound && !pack_compatibility){
        if(play_type=='single'){
          sound['_sprite'][keycode][0] = initOne
          sound['_sprite'][keycode][1] = initTwo
        }
        else{
          sound['_sprite']['__default'][0] = initOne
          sound['_sprite']['__default'][1] = initTwo
        }
      }
}

function playMouseSound(mouseCode, volume, downOrUp){
  var keycode = `keycode-${mouseCode}`;

  if(downOrUp == 'down'){
    keycode = `keycode-${mouseCode}`;
  }
  else if(downOrUp == 'up'){
    keycode = `keycode-0${mouseCode}`;
  }

  const play_type = current_mouse_pack.key_define_type ? current_mouse_pack.key_define_type : 'single';
  const sound = play_type == 'single' ? current_mouse_pack.sound : current_mouse_pack.sound[keycode];
  if (!sound) {
    return;
  }

  sound.volume(Number(volume / 100));
  if (play_type == 'single') {
    sound.play(keycode);
  } else {
    sound.play();
  }
}