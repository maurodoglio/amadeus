// Projectile system for enemy attacks
import { rectCollision } from './utils.js';

export class Projectile {
    constructor(x, y, vx, vy, { damage = 1, lifetime = 180, type = 'note', width = 12, height = 12 } = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = width;
        this.height = height;
        this.damage = damage;
        this.lifetime = lifetime;
        this.type = type;
        this.active = true;
        this.age = 0;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.age++;

        if (this.age >= this.lifetime || this.x < -50 || this.x > 1010 || this.y > 590) {
            this.active = false;
        }
    }

    hitsPlayer(player) {
        if (!this.active || !player.alive) return false;
        return rectCollision(this, player);
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        if (this.type === 'note') {
            // Musical note projectile
            ctx.fillStyle = '#ff6b9d';
            ctx.font = '16px serif';
            ctx.fillText('♪', this.x, this.y + 12);
        } else if (this.type === 'shockwave') {
            // Expanding shockwave ring
            const alpha = 1 - (this.age / this.lifetime);
            ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
                this.width / 2, this.height / 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'baton') {
            // Conductor's baton strike
            ctx.fillStyle = '#e0e0ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'beat') {
            // Metronome beat pulse
            const alpha = 1 - (this.age / this.lifetime);
            ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2,
                this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

export class Shockwave {
    constructor(x, y, { maxRadius = 80, expandSpeed = 3, damage = 1, lifetime = 30 } = {}) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = maxRadius;
        this.expandSpeed = expandSpeed;
        this.damage = damage;
        this.lifetime = lifetime;
        this.age = 0;
        this.active = true;
        this.hitPlayer = false;
        this.width = 0;
        this.height = 0;
    }

    update() {
        if (!this.active) return;
        this.radius += this.expandSpeed;
        this.width = this.radius * 2;
        this.height = this.radius;
        this.age++;
        if (this.age >= this.lifetime || this.radius >= this.maxRadius) {
            this.active = false;
        }
    }

    hitsPlayer(player) {
        if (!this.active || this.hitPlayer || !player.alive) return false;
        const dx = (player.x + player.width / 2) - this.x;
        const dy = (player.y + player.height / 2) - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.radius + player.width / 2 && player.grounded) {
            this.hitPlayer = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = 1 - (this.age / this.lifetime);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 0.8, this.radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
