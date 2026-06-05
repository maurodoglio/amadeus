import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { settingsManager } from '../utils/SettingsManager.js';
import { createPanel, createButton, drawTrebleClef, COLORS } from '../ui/UITheme.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    this.showingSettings = false;

    // Semi-transparent dark overlay with sepia tint
    this.overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x1a1a0e, 0.75
    );

    this.createMainMenu();

    // ESC/P to resume
    this.input.keyboard.on('keydown-ESC', this.handleResume, this);
    this.input.keyboard.on('keydown-P', this.handleResume, this);
  }

  handleResume() {
    if (this.showingSettings) {
      this.hideSettings();
    } else {
      this.resume();
    }
  }

  createMainMenu() {
    this.menuContainer = this.add.container(0, 0);

    // Parchment panel behind menu
    const panelW = 300;
    const panelH = 360;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;
    const panel = createPanel(this, panelX, panelY, panelW, panelH);
    this.menuContainer.add(panel);

    // Treble clef ornament
    drawTrebleClef(this, GAME_WIDTH / 2 - 50, panelY + 25, 1.2);
    drawTrebleClef(this, GAME_WIDTH / 2 + 35, panelY + 25, 1.2);

    const title = this.add.text(GAME_WIDTH / 2, panelY + 35, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.menuContainer.add(title);

    const buttons = [
      { text: 'Resume', action: () => this.resume() },
      { text: 'Restart Level', action: () => this.restartLevel() },
      { text: 'Fullscreen', action: () => this.toggleFullscreen() },
      { text: 'Settings', action: () => this.showSettings() },
      { text: 'Accessibility', action: () => this.showAccessibility() },
      { text: 'Quit to Menu', action: () => this.quitToMenu() }
    ];

    this.menuItems = [];
    buttons.forEach((btn, i) => {
      const y = panelY + 80 + i * 46;
      const button = createButton(this, GAME_WIDTH / 2, y, btn.text, btn.action, 220);
      this.menuItems.push(button);
      this.menuContainer.add(button);
    });
  }

  showSettings() {
    this.showingSettings = true;
    this.menuContainer.setVisible(false);

    this.settingsContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const title = this.add.text(0, -160, 'SETTINGS', {
      font: '30px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // Music volume slider
    this.createSlider('Music Volume', -90, 'musicVolume');

    // SFX volume slider
    this.createSlider('SFX Volume', -30, 'sfxVolume');

    // Screen shake toggle
    this.createToggle('Screen Shake', 40, 'screenShake');

    // Particles toggle
    this.createToggle('Particles', 90, 'particles');

    // Back button
    const back = this.add.text(0, 150, '< Back', {
      font: '20px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setStyle({ fill: '#FFD700' }));
    back.on('pointerout', () => back.setStyle({ fill: '#87CEEB' }));
    back.on('pointerdown', () => this.hideSettings());
    this.settingsContainer.add(back);
  }

  createSlider(label, y, key) {
    const currentValue = settingsManager.get(key);

    const labelText = this.add.text(-180, y, label, {
      font: '16px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.settingsContainer.add(labelText);

    // Slider track
    const trackX = 40;
    const trackWidth = 160;
    const track = this.add.rectangle(trackX, y, trackWidth, 6, 0x555555).setOrigin(0, 0.5);
    this.settingsContainer.add(track);

    // Slider fill
    const fill = this.add.rectangle(trackX, y, trackWidth * currentValue, 6, 0xFFD700).setOrigin(0, 0.5);
    this.settingsContainer.add(fill);

    // Slider handle
    const handleX = trackX + trackWidth * currentValue;
    const handle = this.add.circle(handleX, y, 10, 0xFFFFFF)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.settingsContainer.add(handle);

    // Value text
    const valueText = this.add.text(trackX + trackWidth + 20, y,
      Math.round(currentValue * 100) + '%', {
        font: '14px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0, 0.5);
    this.settingsContainer.add(valueText);

    // Drag handling - use scene-level container offset
    handle.on('drag', (pointer) => {
      const containerX = GAME_WIDTH / 2;
      const localX = pointer.x - containerX;
      const clampedX = Phaser.Math.Clamp(localX, trackX, trackX + trackWidth);
      handle.x = clampedX;

      const value = (clampedX - trackX) / trackWidth;
      fill.width = trackWidth * value;
      valueText.setText(Math.round(value * 100) + '%');
      settingsManager.set(key, value);

      this.applyAudioSettings();
    });
  }

  createToggle(label, y, key) {
    const currentValue = settingsManager.get(key);

    const labelText = this.add.text(-180, y, label, {
      font: '16px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.settingsContainer.add(labelText);

    const toggleBg = this.add.rectangle(80, y, 50, 24, currentValue ? 0x4CAF50 : 0x555555, 1)
      .setInteractive({ useHandCursor: true });
    this.settingsContainer.add(toggleBg);

    const toggleKnob = this.add.circle(currentValue ? 97 : 63, y, 9, 0xFFFFFF);
    this.settingsContainer.add(toggleKnob);

    const stateText = this.add.text(120, y, currentValue ? 'ON' : 'OFF', {
      font: '14px monospace',
      fill: currentValue ? '#4CAF50' : '#888888'
    }).setOrigin(0, 0.5);
    this.settingsContainer.add(stateText);

    toggleBg.on('pointerdown', () => {
      const newValue = !settingsManager.get(key);
      settingsManager.set(key, newValue);

      toggleBg.setFillStyle(newValue ? 0x4CAF50 : 0x555555);
      toggleKnob.x = newValue ? 97 : 63;
      stateText.setText(newValue ? 'ON' : 'OFF');
      stateText.setStyle({ fill: newValue ? '#4CAF50' : '#888888' });
    });
  }

  showAccessibility() {
    this.scene.sleep();
    this.scene.launch('AccessibilityScene', { returnScene: 'PauseScene' });
  }

  hideSettings() {
    this.showingSettings = false;
    this.settingsContainer.destroy();
    this.settingsContainer = null;
    this.menuContainer.setVisible(true);
  }

  applyAudioSettings() {
    const musicVolume = settingsManager.get('musicVolume');
    const sfxVolume = settingsManager.get('sfxVolume');

    // Apply to all active sounds
    this.sound.getAll().forEach(sound => {
      if (sound.key && sound.key.startsWith('music_')) {
        sound.setVolume(musicVolume);
      } else if (sound.key && sound.key.startsWith('sfx_')) {
        sound.setVolume(sfxVolume);
      }
    });
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  resume() {
    const pausedScene = this.registry.get('pausedScene');
    if (pausedScene) {
      this.scene.resume(pausedScene);
    }
    this.scene.stop();
  }

  restartLevel() {
    const pausedScene = this.registry.get('pausedScene');
    if (pausedScene) {
      this.scene.stop(pausedScene);
      this.scene.start(pausedScene);
    }
    this.scene.stop();
  }

  quitToMenu() {
    const pausedScene = this.registry.get('pausedScene');
    if (pausedScene) {
      this.scene.stop(pausedScene);
    }
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
    this.scene.stop();
  }

  shutdown() {
    this.input.keyboard.off('keydown-ESC', this.handleResume, this);
    this.input.keyboard.off('keydown-P', this.handleResume, this);
  }
}
