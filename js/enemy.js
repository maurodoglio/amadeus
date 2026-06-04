// Enemy AI system with state machines and difficulty scaling
import { distance, directionTo, clamp, randomRange } from './utils.js';
import { Projectile, Shockwave } from './projectile.js';

// Difficulty scaling config per level
export function getDifficultyConfig(level) {
    const base = {
        speedMultiplier: 1,
        attackCooldownMultiplier: 1, // lower = faster attacks
        healthMultiplier: 1,
        aggressionRadius: 200,
        maxProjectiles: 3,
        maxSummons: 2
    };
    // Scale up with caps
    const scale = 1 + (level - 1) * 0.15;
    return {
        speedMultiplier: clamp(scale, 1, 2.0),
        attackCooldownMultiplier: clamp(1 / scale, 0.5, 1),
        healthMultiplier: clamp(scale, 1, 2.5),
        aggressionRadius: clamp(200 + level * 20, 200, 400),
        maxProjectiles: clamp(Math.floor(3 + level * 0.5), 3, 6),
        maxSummons: clamp(Math.floor(2 + level * 0.3), 2, 4)
    };
}

// Base Enemy class with state machine
class Enemy {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.vx = 0;
        this.vy = 0;
        this.health = config.health || 2;
        this.maxHealth = this.health;
        this.speed = config.speed || 1.5;
        this.gravity = 0.5;
        this.grounded = false;
        this.alive = true;
        this.state = 'patrol';
        this.stateTimer = 0;
        this.facing = 1;
        this.patrolRange = config.patrolRange || 100;
        this.startX = x;
        this.detectionRadius = config.detectionRadius || 200;
        this.projectiles = [];
        this.shockwaves = [];
        this.flashTimer = 0;
        this.type = 'base';
    }

    applyDifficulty(difficulty) {
        this.speed *= difficulty.speedMultiplier;
        this.health = Math.ceil(this.health * difficulty.healthMultiplier);
        this.maxHealth = this.health;
        this.detectionRadius = difficulty.aggressionRadius;
    }

    update(player, platforms, dt) {
        if (!this.alive) return;

        this.stateTimer++;
        if (this.flashTimer > 0) this.flashTimer--;

        // Apply gravity
        this.vy += this.gravity;
        this.vy = clamp(this.vy, -15, 12);

        this.updateState(player, platforms, dt);

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Platform collision
        this.grounded = false;
        for (const p of platforms) {
            if (this.collidesWith(p)) {
                if (this.vy > 0) {
                    this.y = p.y - this.height;
                    this.grounded = true;
                    this.vy = 0;
                } else if (this.vy < 0) {
                    this.y = p.y + p.height;
                    this.vy = 0;
                }
            }
        }

        // Keep in bounds
        if (this.y > 600) this.alive = false;

        // Update projectiles
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.active);

        this.shockwaves.forEach(s => s.update());
        this.shockwaves = this.shockwaves.filter(s => s.active);
    }

    updateState(player, platforms, dt) {
        // Override in subclass
    }

    collidesWith(rect) {
        return (
            this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y
        );
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 10;
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    detectsPlayer(player) {
        return distance(this, player) < this.detectionRadius;
    }

    draw(ctx) {
        if (!this.alive) return;
        // Flash white when hit
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
    }

    drawHealthBar(ctx) {
        if (this.health >= this.maxHealth) return;
        const barWidth = this.width;
        const barHeight = 4;
        const x = this.x;
        const y = this.y - 8;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y, barWidth * (this.health / this.maxHealth), barHeight);
    }
}

// Singer - patrols and shoots musical note projectiles
export class Singer extends Enemy {
    constructor(x, y, difficulty) {
        super(x, y, { width: 30, height: 40, health: 3, speed: 1.2, patrolRange: 120, detectionRadius: 250 });
        this.type = 'singer';
        this.attackCooldown = 0;
        this.attackRate = 90; // frames between shots
        this.windupTimer = 0;
        this.maxProjectiles = 3;

        if (difficulty) {
            this.applyDifficulty(difficulty);
            this.attackRate = Math.floor(this.attackRate * difficulty.attackCooldownMultiplier);
            this.maxProjectiles = difficulty.maxProjectiles;
        }
    }

    updateState(player, platforms, dt) {
        if (this.attackCooldown > 0) this.attackCooldown--;

        switch (this.state) {
            case 'patrol':
                this.vx = this.speed * this.facing;
                if (this.x > this.startX + this.patrolRange) this.facing = -1;
                if (this.x < this.startX - this.patrolRange) this.facing = 1;

                if (this.detectsPlayer(player)) {
                    this.state = 'alert';
                    this.stateTimer = 0;
                }
                break;

            case 'alert':
                this.vx = 0;
                // Face player
                this.facing = player.x > this.x ? 1 : -1;

                if (this.stateTimer > 20) {
                    this.state = 'attack';
                    this.stateTimer = 0;
                    this.windupTimer = 20;
                }
                if (!this.detectsPlayer(player)) {
                    this.state = 'patrol';
                }
                break;

            case 'attack':
                this.vx = 0;
                this.windupTimer--;

                if (this.windupTimer <= 0 && this.attackCooldown <= 0) {
                    this.shootNote(player);
                    this.attackCooldown = this.attackRate;
                    this.state = 'cooldown';
                    this.stateTimer = 0;
                }
                break;

            case 'cooldown':
                this.vx = 0;
                if (this.stateTimer > 30) {
                    this.state = this.detectsPlayer(player) ? 'alert' : 'patrol';
                    this.stateTimer = 0;
                }
                break;
        }
    }

    shootNote(player) {
        if (this.projectiles.length >= this.maxProjectiles) return;
        const dir = directionTo(this, player);
        const speed = 4;
        this.projectiles.push(new Projectile(
            this.x + this.width / 2, this.y + 10,
            dir.x * speed, dir.y * speed,
            { type: 'note', damage: 1, lifetime: 120 }
        ));
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.flashTimer > 0) { super.draw(ctx); return; }

        ctx.save();
        // Body - opera singer style
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x + 2, this.y + 14, 26, 22);

        // Head
        ctx.fillStyle = '#ffd4a3';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 10, 9, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (open when attacking)
        if (this.state === 'attack' || this.windupTimer > 0) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + 15 + this.facing * 3, this.y + 13, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Legs
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(this.x + 6, this.y + 34, 6, 6);
        ctx.fillRect(this.x + 18, this.y + 34, 6, 6);

        this.drawHealthBar(ctx);
        ctx.restore();

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));
    }
}

// DrumTroll - jumps and creates shockwaves on landing
export class DrumTroll extends Enemy {
    constructor(x, y, difficulty) {
        super(x, y, { width: 40, height: 36, health: 5, speed: 1, patrolRange: 80, detectionRadius: 180 });
        this.type = 'drumtroll';
        this.jumpCooldown = 0;
        this.jumpRate = 120;
        this.isSlam = false;
        this.slamWarningTimer = 0;

        if (difficulty) {
            this.applyDifficulty(difficulty);
            this.jumpRate = Math.floor(this.jumpRate * difficulty.attackCooldownMultiplier);
        }
    }

    updateState(player, platforms, dt) {
        if (this.jumpCooldown > 0) this.jumpCooldown--;

        switch (this.state) {
            case 'patrol':
                this.vx = this.speed * this.facing;
                if (this.x > this.startX + this.patrolRange) this.facing = -1;
                if (this.x < this.startX - this.patrolRange) this.facing = 1;

                if (this.detectsPlayer(player) && this.jumpCooldown <= 0) {
                    this.state = 'windup';
                    this.stateTimer = 0;
                    this.slamWarningTimer = 30;
                }
                break;

            case 'windup':
                this.vx = 0;
                this.slamWarningTimer--;
                // Shake as warning
                this.x += (Math.random() - 0.5) * 2;

                if (this.slamWarningTimer <= 0) {
                    this.vy = -14;
                    this.isSlam = true;
                    this.state = 'airborne';
                    this.grounded = false;
                }
                break;

            case 'airborne':
                this.vx = 0;
                if (this.grounded && this.isSlam) {
                    // Landing - create shockwave
                    this.shockwaves.push(new Shockwave(
                        this.x + this.width / 2, this.y + this.height,
                        { maxRadius: 100, expandSpeed: 4, damage: 1, lifetime: 25 }
                    ));
                    this.isSlam = false;
                    this.jumpCooldown = this.jumpRate;
                    this.state = 'recovery';
                    this.stateTimer = 0;
                }
                break;

            case 'recovery':
                this.vx = 0;
                if (this.stateTimer > 40) {
                    this.state = 'patrol';
                    this.stateTimer = 0;
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.flashTimer > 0) { super.draw(ctx); return; }

        ctx.save();
        // Body - big round troll
        ctx.fillStyle = '#556b2f';
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 20, 18, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Drum strapped to belly
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 8, this.y + 18, 24, 12);
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 8, this.y + 18, 24, 12);

        // Eyes
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(this.x + 14, this.y + 12, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 26, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#3d4f1f';
        ctx.fillRect(this.x + 8, this.y + 30, 8, 6);
        ctx.fillRect(this.x + 24, this.y + 30, 8, 6);

        // Warning indicator during windup
        if (this.state === 'windup') {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(this.stateTimer * 0.5) * 0.5})`;
            ctx.font = '14px serif';
            ctx.fillText('⚠', this.x + 14, this.y - 5);
        }

        this.drawHealthBar(ctx);
        ctx.restore();

        // Draw shockwaves
        this.shockwaves.forEach(s => s.draw(ctx));
    }
}

// Conductor Ghost - teleports and summons minions
export class ConductorGhost extends Enemy {
    constructor(x, y, difficulty) {
        super(x, y, { width: 34, height: 48, health: 6, speed: 0, detectionRadius: 300 });
        this.type = 'conductor';
        this.teleportCooldown = 0;
        this.teleportRate = 180;
        this.summonCooldown = 0;
        this.summonRate = 300;
        this.maxSummons = 2;
        this.summons = [];
        this.alpha = 1;
        this.teleporting = false;
        this.teleportTarget = null;
        this.gravity = 0; // Ghosts float

        if (difficulty) {
            this.applyDifficulty(difficulty);
            this.teleportRate = Math.floor(this.teleportRate * difficulty.attackCooldownMultiplier);
            this.summonRate = Math.floor(this.summonRate * difficulty.attackCooldownMultiplier);
            this.maxSummons = difficulty.maxSummons;
        }
    }

    updateState(player, platforms, dt) {
        if (this.teleportCooldown > 0) this.teleportCooldown--;
        if (this.summonCooldown > 0) this.summonCooldown--;
        this.vy = 0;
        this.vx = 0;

        // Float gently
        this.y += Math.sin(this.stateTimer * 0.03) * 0.5;

        // Clean dead summons
        this.summons = this.summons.filter(s => s.alive);

        switch (this.state) {
            case 'patrol':
                if (this.detectsPlayer(player)) {
                    this.state = 'active';
                    this.stateTimer = 0;
                }
                break;

            case 'active':
                this.facing = player.x > this.x ? 1 : -1;

                // Teleport when player gets too close
                if (distance(this, player) < 80 && this.teleportCooldown <= 0) {
                    this.state = 'teleport_out';
                    this.stateTimer = 0;
                    // Choose teleport destination away from player
                    const offset = (Math.random() > 0.5 ? 1 : -1) * randomRange(150, 250);
                    this.teleportTarget = {
                        x: clamp(this.x + offset, 50, 880),
                        y: clamp(this.y + randomRange(-50, 50), 50, 400)
                    };
                }

                // Summon minions
                if (this.summonCooldown <= 0 && this.summons.length < this.maxSummons) {
                    this.state = 'summoning';
                    this.stateTimer = 0;
                }

                if (!this.detectsPlayer(player)) {
                    this.state = 'patrol';
                }
                break;

            case 'teleport_out':
                this.alpha -= 0.05;
                if (this.alpha <= 0) {
                    this.alpha = 0;
                    if (this.teleportTarget) {
                        this.x = this.teleportTarget.x;
                        this.y = this.teleportTarget.y;
                    }
                    this.state = 'teleport_in';
                    this.stateTimer = 0;
                }
                break;

            case 'teleport_in':
                this.alpha += 0.05;
                if (this.alpha >= 1) {
                    this.alpha = 1;
                    this.teleportCooldown = this.teleportRate;
                    this.state = 'active';
                    this.stateTimer = 0;
                }
                break;

            case 'summoning':
                if (this.stateTimer > 40) {
                    this.spawnMinion(platforms);
                    this.summonCooldown = this.summonRate;
                    this.state = 'active';
                    this.stateTimer = 0;
                }
                break;
        }

        // Update summons
        this.summons.forEach(s => s.update(player, platforms, dt));
    }

    spawnMinion(platforms) {
        const minion = new GhostMinion(
            this.x + randomRange(-40, 40),
            this.y + 20
        );
        this.summons.push(minion);
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.flashTimer > 0) { super.draw(ctx); return; }

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Ghost body - flowing
        ctx.fillStyle = '#7b68ee';
        ctx.beginPath();
        ctx.moveTo(this.x + 17, this.y);
        ctx.quadraticCurveTo(this.x + 34, this.y + 5, this.x + 32, this.y + 30);
        // Wavy bottom
        ctx.quadraticCurveTo(this.x + 28, this.y + 44, this.x + 24, this.y + 48);
        ctx.quadraticCurveTo(this.x + 20, this.y + 42, this.x + 17, this.y + 48);
        ctx.quadraticCurveTo(this.x + 14, this.y + 42, this.x + 10, this.y + 48);
        ctx.quadraticCurveTo(this.x + 6, this.y + 44, this.x + 2, this.y + 30);
        ctx.quadraticCurveTo(this.x, this.y + 5, this.x + 17, this.y);
        ctx.fill();

        // Top hat
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + 8, this.y - 12, 18, 14);
        ctx.fillRect(this.x + 4, this.y, 26, 4);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 16, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 22, this.y + 16, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 16, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 22, this.y + 16, 2, 0, Math.PI * 2);
        ctx.fill();

        // Baton
        if (this.state === 'summoning') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            const waveOffset = Math.sin(this.stateTimer * 0.3) * 10;
            ctx.beginPath();
            ctx.moveTo(this.x + 30, this.y + 10);
            ctx.lineTo(this.x + 44 + waveOffset, this.y - 5);
            ctx.stroke();
        }

        this.drawHealthBar(ctx);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Draw summons
        this.summons.forEach(s => s.draw(ctx));
    }
}

// Ghost Minion - summoned by Conductor
class GhostMinion extends Enemy {
    constructor(x, y) {
        super(x, y, { width: 20, height: 20, health: 1, speed: 2, detectionRadius: 300 });
        this.type = 'minion';
        this.lifetime = 300; // 5 seconds at 60fps
        this.age = 0;
        this.gravity = 0;
    }

    updateState(player, platforms, dt) {
        this.age++;
        this.vy = 0;
        if (this.age >= this.lifetime) {
            this.alive = false;
            return;
        }
        // Float toward player
        const dir = directionTo(this, player);
        this.vx = dir.x * this.speed;
        this.vy = dir.y * this.speed;
    }

    draw(ctx) {
        if (!this.alive) return;
        const alpha = 1 - (this.age / this.lifetime) * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#9370db';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 8, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 13, this.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Sheet Music Bats - fly in formation
export class SheetMusicBat extends Enemy {
    constructor(x, y, difficulty, { isLeader = false, leader = null, formationOffset = { x: 0, y: 0 } } = {}) {
        super(x, y, { width: 24, height: 16, health: 1, speed: 2.5, detectionRadius: 400 });
        this.type = 'bat';
        this.isLeader = isLeader;
        this.leader = leader;
        this.formationOffset = formationOffset;
        this.gravity = 0;
        this.baseY = y;
        this.waveAngle = Math.random() * Math.PI * 2;
        this.swoopCooldown = 0;
        this.swoopRate = 200;
        this.swooping = false;

        if (difficulty) {
            this.applyDifficulty(difficulty);
            this.swoopRate = Math.floor(this.swoopRate * difficulty.attackCooldownMultiplier);
        }
    }

    updateState(player, platforms, dt) {
        this.vy = 0;
        if (this.swoopCooldown > 0) this.swoopCooldown--;
        this.waveAngle += 0.04;

        if (this.isLeader) {
            this.updateLeader(player);
        } else {
            this.updateFollower();
        }
    }

    updateLeader(player) {
        switch (this.state) {
            case 'patrol':
                // Sine wave flight pattern
                this.vx = this.speed * this.facing;
                this.y = this.baseY + Math.sin(this.waveAngle) * 30;

                if (this.x > this.startX + 200) this.facing = -1;
                if (this.x < this.startX - 200) this.facing = 1;

                if (this.detectsPlayer(player) && this.swoopCooldown <= 0) {
                    this.state = 'swoop';
                    this.stateTimer = 0;
                    this.swooping = true;
                }
                break;

            case 'swoop':
                // Dive toward player
                const dir = directionTo(this, player);
                this.vx = dir.x * this.speed * 2;
                this.vy = dir.y * this.speed * 2;
                this.x += this.vx;
                this.y += this.vy;
                this.vx = 0;
                this.vy = 0;

                if (this.stateTimer > 40 || distance(this, player) < 20) {
                    this.state = 'retreat';
                    this.stateTimer = 0;
                }
                break;

            case 'retreat':
                this.vy = -2;
                if (this.y <= this.baseY) {
                    this.y = this.baseY;
                    this.state = 'patrol';
                    this.swoopCooldown = this.swoopRate;
                    this.swooping = false;
                }
                break;
        }
    }

    updateFollower() {
        if (!this.leader || !this.leader.alive) {
            // Leader dead - become independent
            this.isLeader = true;
            this.leader = null;
            return;
        }
        // Follow leader with offset
        const targetX = this.leader.x + this.formationOffset.x;
        const targetY = this.leader.y + this.formationOffset.y;
        this.x += (targetX - this.x) * 0.08;
        this.y += (targetY - this.y) * 0.08;
        this.vx = 0;
        this.vy = 0;
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.flashTimer > 0) { super.draw(ctx); return; }

        ctx.save();
        const cx = this.x + 12;
        const cy = this.y + 8;
        const wingFlap = Math.sin(this.stateTimer * 0.3) * 0.4;

        // Wings (sheet music pages)
        ctx.fillStyle = '#f5f0e0';
        ctx.save();
        ctx.translate(cx - 10, cy);
        ctx.rotate(-0.3 + wingFlap);
        ctx.fillRect(-10, -6, 12, 10);
        // Staff lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-9, -4 + i * 3);
            ctx.lineTo(1, -4 + i * 3);
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(cx + 10, cy);
        ctx.rotate(0.3 - wingFlap);
        ctx.fillRect(-2, -6, 12, 10);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-1, -4 + i * 3);
            ctx.lineTo(9, -4 + i * 3);
            ctx.stroke();
        }
        ctx.restore();

        // Body (small dark center)
        ctx.fillStyle = '#2c2c2c';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 2, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Metronome Sentinel - attacks on a predictable beat
export class MetronomeSentinel extends Enemy {
    constructor(x, y, difficulty) {
        super(x, y, { width: 24, height: 50, health: 4, speed: 0, detectionRadius: 200 });
        this.type = 'metronome';
        this.beatInterval = 90; // frames between beats
        this.windupTime = 30;
        this.attackWindow = 15;
        this.beatTimer = 0;
        this.pendulumAngle = 0;
        this.pendulumDir = 1;
        this.gravity = 0.5;
        this.attackRadius = 60;

        if (difficulty) {
            this.applyDifficulty(difficulty);
            this.beatInterval = Math.max(50, Math.floor(this.beatInterval * difficulty.attackCooldownMultiplier));
        }
    }

    updateState(player, platforms, dt) {
        this.vx = 0;
        this.beatTimer++;

        // Pendulum swing animation
        const beatProgress = (this.beatTimer % this.beatInterval) / this.beatInterval;
        this.pendulumAngle = Math.sin(beatProgress * Math.PI * 2) * 0.6;

        const timeToBeat = this.beatTimer % this.beatInterval;

        switch (this.state) {
            case 'patrol':
                if (this.detectsPlayer(player)) {
                    this.state = 'active';
                    this.beatTimer = 0;
                }
                break;

            case 'active':
                // Windup phase - visual warning before attack
                if (timeToBeat >= this.beatInterval - this.windupTime && timeToBeat < this.beatInterval - this.attackWindow) {
                    this.state = 'windup';
                }
                if (!this.detectsPlayer(player)) {
                    this.state = 'patrol';
                }
                break;

            case 'windup':
                // Beat is about to hit
                if (timeToBeat >= this.beatInterval - this.attackWindow) {
                    this.state = 'strike';
                    this.stateTimer = 0;
                }
                break;

            case 'strike':
                if (this.stateTimer === 0) {
                    // Create beat pulse projectile
                    this.projectiles.push(new Projectile(
                        this.x + this.width / 2 - 25, this.y + this.height / 2 - 25,
                        0, 0,
                        { type: 'beat', damage: 1, lifetime: this.attackWindow, width: 50, height: 50 }
                    ));
                }
                if (this.stateTimer >= this.attackWindow) {
                    this.state = 'active';
                    this.beatTimer = 0;
                }
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.flashTimer > 0) { super.draw(ctx); return; }

        ctx.save();
        const cx = this.x + this.width / 2;
        const baseY = this.y + this.height;

        // Base (triangular metronome body)
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(cx, this.y + 5);
        ctx.lineTo(this.x + this.width + 4, baseY);
        ctx.lineTo(this.x - 4, baseY);
        ctx.closePath();
        ctx.fill();

        // Face plate
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.moveTo(cx, this.y + 15);
        ctx.lineTo(this.x + this.width, baseY - 5);
        ctx.lineTo(this.x, baseY - 5);
        ctx.closePath();
        ctx.fill();

        // Pendulum arm
        ctx.save();
        ctx.translate(cx, baseY - 10);
        ctx.rotate(this.pendulumAngle);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -35);
        ctx.stroke();
        // Pendulum bob
        ctx.fillStyle = this.state === 'strike' ? '#ff0000' : (this.state === 'windup' ? '#ffaa00' : '#666');
        ctx.beginPath();
        ctx.arc(0, -35, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Beat warning indicator
        if (this.state === 'windup') {
            const flash = Math.sin(this.stateTimer * 0.8) > 0;
            if (flash) {
                ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, this.y + this.height / 2, this.attackRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        this.drawHealthBar(ctx);
        ctx.restore();

        // Draw beat projectiles
        this.projectiles.forEach(p => p.draw(ctx));
    }
}

// Create bat formation helper
export function createBatFormation(x, y, count, difficulty) {
    const bats = [];
    const leader = new SheetMusicBat(x, y, difficulty, { isLeader: true });
    bats.push(leader);

    for (let i = 1; i < count; i++) {
        const row = Math.ceil(i / 2);
        const side = i % 2 === 0 ? 1 : -1;
        const offset = { x: side * row * 30, y: row * 20 };
        const follower = new SheetMusicBat(x + offset.x, y + offset.y, difficulty, {
            isLeader: false,
            leader: leader,
            formationOffset: offset
        });
        bats.push(follower);
    }
    return bats;
}

// Enemy factory for level spawning
export function createEnemy(type, x, y, difficulty, options = {}) {
    switch (type) {
        case 'singer': return new Singer(x, y, difficulty);
        case 'drumtroll': return new DrumTroll(x, y, difficulty);
        case 'conductor': return new ConductorGhost(x, y, difficulty);
        case 'bat': return new SheetMusicBat(x, y, difficulty, options);
        case 'metronome': return new MetronomeSentinel(x, y, difficulty);
        default: return new Singer(x, y, difficulty);
    }
}
