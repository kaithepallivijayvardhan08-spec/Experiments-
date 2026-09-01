'use strict';

/**
 * Reads the physical keyboard and pushes a full snapshot to the server on
 * every change. The server decides whether a key still belongs to the player.
 */
window.InputManager = (function () {
  const KEY_LOOKUP = {
    KeyW: 'W',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    ArrowUp: 'W',
    ArrowLeft: 'A',
    ArrowDown: 'S',
    ArrowRight: 'D',
    Space: 'SPACE',
    KeyE: 'SPACE'
  };

  const POWER_HOTKEYS = { Digit1: 0, Digit2: 1, Digit3: 2 };

  function InputManager(options) {
    this.state = { W: false, A: false, S: false, D: false, SPACE: false };
    this.onChange = options.onChange || function () {};
    this.onPower = options.onPower || function () {};
    this.onToggleScoreboard = options.onToggleScoreboard || function () {};
    this.enabled = true;
    this.keyDown = this.handleKeyDown.bind(this);
    this.keyUp = this.handleKeyUp.bind(this);
  }

  InputManager.prototype.attach = function () {
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
  };

  InputManager.prototype.detach = function () {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
  };

  InputManager.prototype.handleKeyDown = function (event) {
    if (!this.enabled) {
      return;
    }
    if (event.code === 'Tab') {
      event.preventDefault();
      this.onToggleScoreboard(true);
      return;
    }
    if (POWER_HOTKEYS[event.code] !== undefined) {
      event.preventDefault();
      this.onPower(POWER_HOTKEYS[event.code]);
      return;
    }
    const key = KEY_LOOKUP[event.code];
    if (!key) {
      return;
    }
    event.preventDefault();
    if (!this.state[key]) {
      this.state[key] = true;
      this.onChange(this.state);
    }
  };

  InputManager.prototype.handleKeyUp = function (event) {
    if (event.code === 'Tab') {
      this.onToggleScoreboard(false);
      return;
    }
    const key = KEY_LOOKUP[event.code];
    if (!key) {
      return;
    }
    if (this.state[key]) {
      this.state[key] = false;
      this.onChange(this.state);
    }
  };

  InputManager.prototype.releaseAll = function () {
    const self = this;
    let changed = false;
    Object.keys(this.state).forEach(function (key) {
      if (self.state[key]) {
        self.state[key] = false;
        changed = true;
      }
    });
    if (changed) {
      this.onChange(this.state);
    }
  };

  return InputManager;
})();
