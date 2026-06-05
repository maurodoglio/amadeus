import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox.js';

/**
 * Base NPC class with proximity-triggered dialogue.
 * NPCs are friendly characters that give tips, hints, and optional side-quests.
 */
export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config = {}) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.npcName = config.name || 'NPC';
    this.dialogues = config.dialogues || [];
    this.interactionRadius = config.interactionRadius || 60;
    this.hasInteracted = false;
    this.repeatDialogues = config.repeatDialogues || null;
    this.onInteractionComplete = config.onInteractionComplete || null;

    // Interaction prompt (shown when player is near)
    this.prompt = scene.add.text(x, y - 40, '▲ Talk', {
      font: 'bold 11px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    // Floating idle animation
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Name label above NPC
    this.nameLabel = scene.add.text(x, y - 55, this.npcName, {
      font: '10px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);

    this.playerNearby = false;
    this.isTalking = false;
  }

  update(player, dialogueBox) {
    if (!player || player.isDead || this.isTalking) return;

    const distance = Phaser.Math.Distance.Between(
      this.x, this.y, player.x, player.y
    );

    if (distance < this.interactionRadius) {
      if (!this.playerNearby) {
        this.playerNearby = true;
        this.prompt.setVisible(true);
      }
    } else {
      if (this.playerNearby) {
        this.playerNearby = false;
        this.prompt.setVisible(false);
      }
    }
  }

  interact(dialogueBox) {
    if (this.isTalking || !this.playerNearby) return false;

    const lines = this.hasInteracted && this.repeatDialogues
      ? this.repeatDialogues
      : this.dialogues;

    if (lines.length === 0) return false;

    this.isTalking = true;
    this.prompt.setVisible(false);

    // Freeze Mozart before dialogue starts
    if (this.scene.mozart) {
      this.scene.mozart.setVelocity(0, 0);
    }

    dialogueBox.show(lines, () => {
      this.isTalking = false;
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        if (this.onInteractionComplete) {
          this.onInteractionComplete(this.scene);
        }
      }
    });

    return true;
  }

  destroy() {
    if (this.prompt) this.prompt.destroy();
    if (this.nameLabel) this.nameLabel.destroy();
    super.destroy();
  }
}
