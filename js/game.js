// Main game loop and canvas management
import { Player } from './player.js';
import { createLevel } from './level.js';
import { rectCollision, distance } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

// Game state
const game = {
    state: 'title', // title, playing, gameover, levelcomplete
    currentLevel: 1,
    player: null,
    level: null,
    keys: {},
    stateTimer: 0,
    totalScore: 0
};

// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    if (e.key === 'Enter') handleStateTransition();
    if (e.key === 'x' || e.key === 'X') playerAttack();
});
document.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

function handleStateTransition() {
    switch (game.state) {
        case 'title':
            startLevel(1);
            break;
        case 'gameover':
            game.state = 'title';
            game.totalScore = 0;
            break;
        case 'levelcomplete':
            startLevel(game.currentLevel + 1);
            break;
    }
}

function startLevel(levelNum) {
    game.currentLevel = levelNum;
    game.level = createLevel(levelNum);
    game.player = new Player(game.level.playerStart.x, game.level.playerStart.y);
    game.player.score = game.totalScore;
    game.state = 'playing';
    game.stateTimer = 0;
}

function playerAttack() {
    if (game.state !== 'playing' || !game.player.alive) return;
    if (game.player.attackCooldown > 0) return;
    game.player.attackCooldown = 20;

    // Melee attack - check collision with enemies in facing direction
    const attackBox = {
        x: game.player.x + (game.player.facing === 1 ? game.player.width : -30),
        y: game.player.y,
        width: 30,
        height: game.player.height
    };

    for (const enemy of getAllEnemies()) {
        if (enemy.alive && rectCollision(attackBox, enemy)) {
            enemy.takeDamage(1);
            if (!enemy.alive) {
                game.player.score += 100;
            }
        }
    }
}

function getAllEnemies() {
    const enemies = [...game.level.enemies];
    // Include conductor summons
    for (const e of game.level.enemies) {
        if (e.type === 'conductor' && e.summons) {
            enemies.push(...e.summons);
        }
    }
    return enemies;
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    game.stateTimer++;

    if (game.state !== 'playing') return;

    const { player, level } = game;

    // Update player
    player.update(game.keys, level.platforms);

    // Update enemies
    for (const enemy of level.enemies) {
        enemy.update(player, level.platforms, 1);
    }

    // Check enemy contact damage
    for (const enemy of getAllEnemies()) {
        if (enemy.alive && player.alive && rectCollision(player, enemy)) {
            // Stomp mechanic - if player is falling and above enemy
            if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
                enemy.takeDamage(2);
                player.vy = -8; // Bounce
                if (!enemy.alive) player.score += 100;
            } else {
                player.takeDamage(1);
            }
        }
    }

    // Check projectile hits on player
    for (const enemy of level.enemies) {
        for (const proj of enemy.projectiles) {
            if (proj.hitsPlayer(player)) {
                player.takeDamage(proj.damage);
                proj.active = false;
            }
        }
        for (const sw of enemy.shockwaves) {
            if (sw.hitsPlayer(player)) {
                player.takeDamage(sw.damage);
            }
        }
    }

    // Check player death
    if (!player.alive) {
        game.state = 'gameover';
        game.stateTimer = 0;
    }

    // Check level complete - all enemies dead
    const allDead = level.enemies.every(e => !e.alive);
    if (allDead) {
        game.totalScore = player.score;
        game.state = 'levelcomplete';
        game.stateTimer = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (game.state) {
        case 'title': drawTitle(); break;
        case 'playing': drawGame(); break;
        case 'gameover': drawGame(); drawGameOver(); break;
        case 'levelcomplete': drawGame(); drawLevelComplete(); break;
    }
}

function drawTitle() {
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(1, '#2d1b69');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#f0e68c';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('AMADEUS', canvas.width / 2, 180);

    ctx.font = '20px Georgia';
    ctx.fillStyle = '#c9a227';
    ctx.fillText("Mozart's Musical Quest", canvas.width / 2, 220);

    // Instructions
    ctx.font = '16px Georgia';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Arrow keys / WASD to move, X to attack', canvas.width / 2, 320);
    ctx.fillText('Jump on enemies or press X to defeat them', canvas.width / 2, 350);
    ctx.fillText('Dodge projectiles, shockwaves, and beat attacks!', canvas.width / 2, 380);

    ctx.fillStyle = '#f0e68c';
    ctx.font = '22px Georgia';
    const flash = Math.sin(game.stateTimer * 0.05) > 0;
    if (flash) ctx.fillText('Press ENTER to start', canvas.width / 2, 450);

    ctx.textAlign = 'left';
}

function drawGame() {
    const { level, player } = game;

    // Background gradient
    const bg = level.background;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(1, bg.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    for (const p of level.platforms) {
        ctx.fillStyle = '#4a3f6b';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#6b5fa0';
        ctx.fillRect(p.x, p.y, p.width, 4);
    }

    // Draw enemies
    for (const enemy of level.enemies) {
        enemy.draw(ctx);
    }

    // Draw player
    player.draw(ctx);

    // Draw attack indicator
    if (player.attackCooldown > 15) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 2;
        const ax = player.x + (player.facing === 1 ? player.width : -30);
        ctx.strokeRect(ax, player.y, 30, player.height);
    }

    // HUD
    drawHUD();
}

function drawHUD() {
    const { player, currentLevel, level } = game;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, 35);

    ctx.font = '14px Georgia';
    ctx.fillStyle = '#f0e68c';
    ctx.fillText(`Level ${currentLevel}: ${level.background.name}`, 10, 22);

    // Health hearts
    for (let i = 0; i < player.maxHealth; i++) {
        ctx.fillStyle = i < player.health ? '#e74c3c' : '#444';
        ctx.font = '16px serif';
        ctx.fillText('♥', 200 + i * 20, 23);
    }

    ctx.fillStyle = '#f0e68c';
    ctx.font = '14px Georgia';
    ctx.fillText(`Score: ${player.score}`, 820, 22);

    // Enemy count
    const alive = game.level.enemies.filter(e => e.alive).length;
    ctx.fillText(`Enemies: ${alive}`, 450, 22);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 40px Georgia';
    ctx.fillText('GAME OVER', canvas.width / 2, 250);

    ctx.fillStyle = '#f0e68c';
    ctx.font = '20px Georgia';
    ctx.fillText(`Final Score: ${game.player.score}`, canvas.width / 2, 300);

    const flash = Math.sin(game.stateTimer * 0.05) > 0;
    if (flash) {
        ctx.font = '18px Georgia';
        ctx.fillText('Press ENTER to try again', canvas.width / 2, 370);
    }
    ctx.textAlign = 'left';
}

function drawLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e68c';
    ctx.font = 'bold 36px Georgia';
    ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, 240);

    ctx.font = '20px Georgia';
    ctx.fillText(`Score: ${game.totalScore}`, canvas.width / 2, 290);

    const flash = Math.sin(game.stateTimer * 0.05) > 0;
    if (flash) {
        ctx.font = '18px Georgia';
        ctx.fillText('Press ENTER for next level', canvas.width / 2, 360);
    }
    ctx.textAlign = 'left';
}

// Start the game
gameLoop();
