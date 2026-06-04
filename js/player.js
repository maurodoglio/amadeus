// Player character - Young Mozart
import { clamp } from './utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 44;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        this.jumpForce = -12;
        this.gravity = 0.6;
        this.grounded = false;
        this.health = 5;
        this.maxHealth = 5;
        this.invincibleTimer = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.alive = true;
        this.attackCooldown = 0;
        this.score = 0;
    }

    update(keys, platforms) {
        if (!this.alive) return;

        // Horizontal movement
        this.vx = 0;
        if (keys['ArrowLeft'] || keys['a']) {
            this.vx = -this.speed;
            this.facing = -1;
        }
        if (keys['ArrowRight'] || keys['d']) {
            this.vx = this.speed;
            this.facing = 1;
        }

        // Jump
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        // Apply gravity
        this.vy += this.gravity;
        this.vy = clamp(this.vy, -20, 15);

        // Move and collide
        this.x += this.vx;
        this.resolveHorizontalCollisions(platforms);
        this.y += this.vy;
        this.resolveVerticalCollisions(platforms);

        // Keep in bounds
        this.x = clamp(this.x, 0, 960 - this.width);
        if (this.y > 540) {
            this.takeDamage(1);
            this.x = 100;
            this.y = 400;
            this.vy = 0;
        }

        // Invincibility timer
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    resolveHorizontalCollisions(platforms) {
        for (const p of platforms) {
            if (this.collidesWith(p)) {
                if (this.vx > 0) this.x = p.x - this.width;
                else if (this.vx < 0) this.x = p.x + p.width;
                this.vx = 0;
            }
        }
    }

    resolveVerticalCollisions(platforms) {
        this.grounded = false;
        for (const p of platforms) {
            if (this.collidesWith(p)) {
                if (this.vy > 0) {
                    this.y = p.y - this.height;
                    this.grounded = true;
                } else if (this.vy < 0) {
                    this.y = p.y + p.height;
                }
                this.vy = 0;
            }
        }
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
        if (this.invincibleTimer > 0) return;
        this.health -= amount;
        this.invincibleTimer = 90; // 1.5 seconds at 60fps
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Blink when invincible
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 5) % 2 === 0) return;

        ctx.save();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Body (coat)
        ctx.fillStyle = '#4a2c8a';
        ctx.fillRect(this.x + 4, this.y + 16, 20, 24);

        // Head
        ctx.fillStyle = '#ffd4a3';
        ctx.beginPath();
        ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Wig (white curly hair)
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(cx - 4, this.y + 5, 6, 0, Math.PI * 2);
        ctx.arc(cx + 4, this.y + 5, 6, 0, Math.PI * 2);
        ctx.arc(cx, this.y + 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(this.x + 6, this.y + 38, 6, 6);
        ctx.fillRect(this.x + 16, this.y + 38, 6, 6);

        ctx.restore();
    }
}
