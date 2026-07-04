import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { accessibilityManager } from '../utils/AccessibilityManager.js';

export class AccessibilityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AccessibilityScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'PauseScene';
  }

  create() {
    this.currentPage = 'main';
    this.remappingAction = null;

    this.overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85
    );

    this.showMainMenu();

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
  }

  clearContainer() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  showMainMenu() {
    this.clearContainer();
    this.currentPage = 'main';
    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -200, 'ACCESSIBILITY', {
      font: '28px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.container.add(title);

    const categories = [
      { text: 'Visual Options', action: () => this.showVisualOptions() },
      { text: 'Motor / Controls', action: () => this.showMotorOptions() },
      { text: 'Difficulty Options', action: () => this.showDifficultyOptions() },
      { text: 'Key Bindings', action: () => this.showKeyBindings() },
      { text: '< Back', action: () => this.goBack() }
    ];

    categories.forEach((cat, i) => {
      const y = -100 + i * 55;
      const color = cat.text === '< Back' ? '#87CEEB' : '#FFFFFF';
      const text = this.add.text(0, y, cat.text, {
        font: '20px monospace',
        fill: color
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setStyle({ fill: '#FFD700' }));
      text.on('pointerout', () => text.setStyle({ fill: color }));
      text.on('pointerdown', cat.action);
      this.container.add(text);
    });
  }

  showVisualOptions() {
    this.clearContainer();
    this.currentPage = 'visual';
    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -200, 'VISUAL OPTIONS', {
      font: '24px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.container.add(title);

    this.createToggleOption('High Contrast', -130, 'highContrast');
    this.createToggleOption('Reduce Flashes', -75, 'reduceFlashes');
    this.createToggleOption('Larger Text', -20, 'largeText');
    this.createCycleOption('Colorblind Mode', 40, 'colorblindMode',
      ['none', 'deuteranopia', 'protanopia', 'tritanopia'],
      ['None', 'Deuteranopia', 'Protanopia', 'Tritanopia']
    );

    this.addBackButton(130);
  }

  showMotorOptions() {
    this.clearContainer();
    this.currentPage = 'motor';
    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -200, 'MOTOR / CONTROLS', {
      font: '24px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.container.add(title);

    this.createCycleOption('Control Scheme', -120, 'controlScheme',
      ['default', 'oneHanded'],
      ['Default (Arrows+Space)', 'One-Handed (WASD+Auto)']
    );

    this.createCycleOption('Game Speed', -50, 'gameSpeed',
      [1, 0.75, 0.5],
      ['1x (Normal)', '0.75x (Slower)', '0.5x (Slowest)']
    );

    this.addBackButton(130);
  }

  showDifficultyOptions() {
    this.clearContainer();
    this.currentPage = 'difficulty';
    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -200, 'DIFFICULTY OPTIONS', {
      font: '24px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.container.add(title);

    this.createToggleOption('Easy Mode (+2 HP, slower enemies)', -120, 'easyMode');
    this.createToggleOption('Invincibility', -60, 'invincible');
    this.createToggleOption('More Checkpoints', 0, 'moreCheckpoints');

    const note = this.add.text(0, 70, 'Easy mode: +2 health, 40% slower enemies,\nwider platforms', {
      font: '13px monospace',
      fill: '#AAAAAA',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(note);

    this.addBackButton(130);
  }

  showKeyBindings() {
    this.clearContainer();
    this.currentPage = 'keybindings';
    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -200, 'KEY BINDINGS', {
      font: '24px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.container.add(title);

    const actions = ['left', 'right', 'jump', 'up', 'down', 'pause'];
    const labels = ['Move Left', 'Move Right', 'Jump', 'Up', 'Down', 'Pause'];

    actions.forEach((action, i) => {
      const y = -140 + i * 42;
      const currentKey = accessibilityManager.getKeyBinding(action);

      const label = this.add.text(-180, y, labels[i], {
        font: '15px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0, 0.5);
      this.container.add(label);

      const keyText = this.add.text(100, y, `[${currentKey}]`, {
        font: '15px monospace',
        fill: '#87CEEB'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.container.add(keyText);

      keyText.on('pointerdown', () => {
        this.startRemapping(action, keyText);
      });
    });

    // Reset button
    const reset = this.add.text(0, 130, 'Reset to Defaults', {
      font: '16px monospace',
      fill: '#FF6666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    reset.on('pointerover', () => reset.setStyle({ fill: '#FF9999' }));
    reset.on('pointerout', () => reset.setStyle({ fill: '#FF6666' }));
    reset.on('pointerdown', () => {
      accessibilityManager.resetKeyBindings();
      this.showKeyBindings();
    });
    this.container.add(reset);

    this.addBackButton(175);
  }

  startRemapping(action, textObj) {
    if (this.remappingAction) return;
    this.remappingAction = action;
    textObj.setText('[Press a key...]');
    textObj.setStyle({ fill: '#FFD700' });

    this.remapListener = this.input.keyboard?.on('keydown', (event) => {
      const key = event.key.toUpperCase();
      const phaserKey = this.keyEventToPhaser(event);
      accessibilityManager.setKeyBinding(action, phaserKey);
      this.remappingAction = null;
      this.input.keyboard?.off('keydown', this.remapListener);
      this.showKeyBindings();
    });
  }

  keyEventToPhaser(event) {
    const map = {
      'ARROWLEFT': 'LEFT',
      'ARROWRIGHT': 'RIGHT',
      'ARROWUP': 'UP',
      'ARROWDOWN': 'DOWN',
      ' ': 'SPACE',
      'ENTER': 'ENTER',
      'SHIFT': 'SHIFT',
      'CONTROL': 'CTRL',
      'ESCAPE': 'ESC'
    };
    const upper = event.key.toUpperCase();
    return map[upper] || upper;
  }

  createToggleOption(label, y, key) {
    const currentValue = accessibilityManager.get(key);

    const labelText = this.add.text(-180, y, label, {
      font: '15px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.container.add(labelText);

    const toggleBg = this.add.rectangle(160, y, 50, 24, currentValue ? 0x4CAF50 : 0x555555)
      .setInteractive({ useHandCursor: true });
    this.container.add(toggleBg);

    const toggleKnob = this.add.circle(currentValue ? 177 : 143, y, 9, 0xFFFFFF);
    this.container.add(toggleKnob);

    const stateText = this.add.text(200, y, currentValue ? 'ON' : 'OFF', {
      font: '13px monospace',
      fill: currentValue ? '#4CAF50' : '#888888'
    }).setOrigin(0, 0.5);
    this.container.add(stateText);

    toggleBg.on('pointerdown', () => {
      const newValue = !accessibilityManager.get(key);
      accessibilityManager.set(key, newValue);
      toggleBg.setFillStyle(newValue ? 0x4CAF50 : 0x555555);
      toggleKnob.x = newValue ? 177 : 143;
      stateText.setText(newValue ? 'ON' : 'OFF');
      stateText.setStyle({ fill: newValue ? '#4CAF50' : '#888888' });
    });
  }

  createCycleOption(label, y, key, values, displayNames) {
    const currentValue = accessibilityManager.get(key);
    const currentIndex = values.indexOf(currentValue);

    const labelText = this.add.text(-180, y, label, {
      font: '15px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.container.add(labelText);

    const valueText = this.add.text(140, y, displayNames[currentIndex >= 0 ? currentIndex : 0], {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.container.add(valueText);

    const leftArrow = this.add.text(40, y, '<', {
      font: '18px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.container.add(leftArrow);

    const rightArrow = this.add.text(240, y, '>', {
      font: '18px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.container.add(rightArrow);

    const cycle = (dir) => {
      let idx = values.indexOf(accessibilityManager.get(key));
      idx = (idx + dir + values.length) % values.length;
      accessibilityManager.set(key, values[idx]);
      valueText.setText(displayNames[idx]);
    };

    leftArrow.on('pointerdown', () => cycle(-1));
    rightArrow.on('pointerdown', () => cycle(1));
    valueText.on('pointerdown', () => cycle(1));
  }

  addBackButton(y) {
    const back = this.add.text(0, y, '< Back', {
      font: '18px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setStyle({ fill: '#FFD700' }));
    back.on('pointerout', () => back.setStyle({ fill: '#87CEEB' }));
    back.on('pointerdown', () => this.showMainMenu());
    this.container.add(back);
  }

  goBack() {
    if (this.currentPage !== 'main') {
      this.showMainMenu();
    } else {
      this.scene.stop();
      if (this.returnScene === 'MenuScene') {
        this.scene.wake('MenuScene');
      } else {
        this.scene.wake('PauseScene');
      }
    }
  }

  shutdown() {
    this.input.keyboard?.off('keydown-ESC');
    if (this.remapListener) {
      this.input.keyboard?.off('keydown', this.remapListener);
    }
  }
}
