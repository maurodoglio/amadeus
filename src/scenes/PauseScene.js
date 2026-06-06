import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { settingsManager } from '../utils/SettingsManager.js';
import { createPanel, createButton, drawTrebleClef, COLORS } from '../ui/UITheme.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';
import { SaveManager } from '../utils/SaveManager.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    this.showingSettings = false;

    this.overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x140f10,
      0.72
    );

    this.createMainMenu();

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

    const panelW = 328;
    const panelH = 414;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;
    const panel = createPanel(this, panelX, panelY, panelW, panelH);
    this.menuContainer.add(panel);

    const leftClef = drawTrebleClef(this, GAME_WIDTH / 2 - 58, panelY + 28, 1.15);
    const rightClef = drawTrebleClef(this, GAME_WIDTH / 2 + 44, panelY + 28, 1.15);
    this.menuContainer.add([leftClef, rightClef]);

    const title = this.add.text(GAME_WIDTH / 2, panelY + 42, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '31px',
      fontStyle: 'bold',
      color: '#FFE59A',
      stroke: '#7B5111',
      strokeThickness: 3
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, panelY + 70, 'The orchestra waits for your cue', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#86643A'
    }).setOrigin(0.5);
    this.menuContainer.add([title, subtitle]);

    const buttons = [
      { text: 'Resume', action: () => this.resume() },
      { text: 'Save Game', action: () => this.saveGame() },
      { text: 'Restart Level', action: () => this.restartLevel() },
      { text: 'Fullscreen', action: () => this.toggleFullscreen() },
      { text: 'Settings', action: () => this.showSettings() },
      { text: 'Accessibility', action: () => this.showAccessibility() },
      { text: 'Quit to Menu', action: () => this.quitToMenu() }
    ];

    this.menuItems = [];
    buttons.forEach((btn, i) => {
      const y = panelY + 112 + i * 42;
      const button = createButton(this, GAME_WIDTH / 2, y, btn.text, () => {
        SFXGenerator.play(this, 'sfx_menuSelect', 0.25);
        btn.action();
      }, 230);
      this.menuItems.push(button);
      this.menuContainer.add(button);
    });
  }

  showSettings() {
    this.showingSettings = true;
    this.menuContainer.setVisible(false);

    this.settingsContainer = this.add.container(0, 0);
    const panelW = 520;
    const panelH = 330;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = createPanel(this, panelX, panelY, panelW, panelH);
    this.settingsContainer.add(panel);

    const title = this.add.text(GAME_WIDTH / 2, panelY + 40, 'SETTINGS', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#FFE59A',
      stroke: '#7B5111',
      strokeThickness: 3
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, panelY + 68, 'Fine tune the performance hall', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#86643A'
    }).setOrigin(0.5);
    this.settingsContainer.add([title, subtitle]);

    this.createSlider(panelX + 42, panelY + 118, 'Music Volume', 'musicVolume');
    this.createSlider(panelX + 42, panelY + 172, 'SFX Volume', 'sfxVolume');
    this.createToggle(panelX + 42, panelY + 238, 'Screen Shake', 'screenShake');
    this.createToggle(panelX + 42, panelY + 284, 'Particles', 'particles');

    const back = createButton(this, GAME_WIDTH / 2, panelY + panelH - 28, 'Back', () => this.hideSettings(), 170);
    this.settingsContainer.add(back);
  }

  createSlider(x, y, label, key) {
    const currentValue = settingsManager.get(key);
    const labelText = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#4A3728'
    }).setOrigin(0, 0.5);
    this.settingsContainer.add(labelText);

    const trackX = x + 195;
    const trackWidth = 180;
    const trackBg = this.add.rectangle(trackX + trackWidth / 2, y, trackWidth, 10, COLORS.greyDark, 0.35)
      .setStrokeStyle(2, COLORS.goldDark, 0.35);
    const fill = this.add.rectangle(trackX, y, trackWidth * currentValue, 10, COLORS.goldLight, 0.95)
      .setOrigin(0, 0.5);
    const handle = this.add.circle(trackX + trackWidth * currentValue, y, 11, COLORS.white, 1)
      .setStrokeStyle(2, COLORS.goldDark)
      .setInteractive({ useHandCursor: true, draggable: true });
    const valueText = this.add.text(trackX + trackWidth + 24, y, `${Math.round(currentValue * 100)}%`, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#4A3728'
    }).setOrigin(0, 0.5);

    this.input.setDraggable(handle);
    handle.on('drag', pointer => {
      const clampedX = Phaser.Math.Clamp(pointer.x, trackX, trackX + trackWidth);
      handle.x = clampedX;
      const value = (clampedX - trackX) / trackWidth;
      fill.width = trackWidth * value;
      valueText.setText(`${Math.round(value * 100)}%`);
      settingsManager.set(key, value);
      this.applyAudioSettings();
    });

    this.settingsContainer.add([trackBg, fill, handle, valueText]);
  }

  createToggle(x, y, label, key) {
    const currentValue = settingsManager.get(key);
    const labelText = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#4A3728'
    }).setOrigin(0, 0.5);
    this.settingsContainer.add(labelText);

    const pill = this.add.rectangle(x + 245, y, 62, 28, currentValue ? 0x7ba25c : 0x8d7a61, 0.95)
      .setStrokeStyle(2, COLORS.goldDark, 0.5)
      .setInteractive({ useHandCursor: true });
    const knob = this.add.circle(currentValue ? x + 262 : x + 228, y, 11, COLORS.white, 1)
      .setStrokeStyle(2, currentValue ? 0x5b7a3a : COLORS.greyDark);
    const stateText = this.add.text(x + 292, y, currentValue ? 'Enabled' : 'Muted', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: currentValue ? '#5B7A3A' : '#8B7D67'
    }).setOrigin(0, 0.5);

    pill.on('pointerdown', () => {
      const newValue = !settingsManager.get(key);
      settingsManager.set(key, newValue);
      pill.setFillStyle(newValue ? 0x7ba25c : 0x8d7a61, 0.95);
      knob.x = newValue ? x + 262 : x + 228;
      knob.setStrokeStyle(2, newValue ? 0x5b7a3a : COLORS.greyDark);
      stateText.setText(newValue ? 'Enabled' : 'Muted');
      stateText.setColor(newValue ? '#5B7A3A' : '#8B7D67');
    });

    this.settingsContainer.add([pill, knob, stateText]);
  }

  showAccessibility() {
    this.scene.sleep();
    this.scene.launch('AccessibilityScene', { returnScene: 'PauseScene' });
  }

  hideSettings() {
    this.showingSettings = false;
    if (this.settingsContainer) {
      this.settingsContainer.destroy();
      this.settingsContainer = null;
    }
    this.menuContainer.setVisible(true);
  }

  applyAudioSettings() {
    const musicVolume = settingsManager.get('musicVolume');
    const sfxVolume = settingsManager.get('sfxVolume');

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

  saveGame() {
    const success = SaveManager.save(this);
    const msg = success ? 'Game Saved!' : 'Save Failed';
    const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170, msg, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: success ? '#7BA25C' : '#CC4444'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => toast.destroy()
    });
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
