// Collision detection and math utilities

export function rectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

export function distance(a, b) {
    const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
    const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
}

export function directionTo(from, to) {
    const dx = (to.x + to.width / 2) - (from.x + from.width / 2);
    const dy = (to.y + to.height / 2) - (from.y + from.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / dist, y: dy / dist };
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Collision categories
export const CollisionLayer = {
    PLAYER: 1,
    ENEMY: 2,
    PLAYER_PROJECTILE: 4,
    ENEMY_PROJECTILE: 8,
    PLATFORM: 16,
    SHOCKWAVE: 32
};
