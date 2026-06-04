// Level definitions with enemy placement and difficulty
import { getDifficultyConfig, createEnemy, createBatFormation } from './enemy.js';

export function createLevel(levelNumber) {
    const difficulty = getDifficultyConfig(levelNumber);

    const level = {
        number: levelNumber,
        difficulty,
        platforms: [],
        enemies: [],
        playerStart: { x: 50, y: 400 },
        background: getLevelBackground(levelNumber)
    };

    // Base ground platform
    level.platforms.push({ x: 0, y: 500, width: 960, height: 40 });

    switch (levelNumber) {
        case 1:
            level.platforms.push(
                { x: 150, y: 400, width: 120, height: 20 },
                { x: 350, y: 350, width: 100, height: 20 },
                { x: 550, y: 380, width: 140, height: 20 },
                { x: 750, y: 320, width: 120, height: 20 }
            );
            // Intro level: just singers
            level.enemies.push(
                createEnemy('singer', 300, 450, difficulty),
                createEnemy('singer', 600, 450, difficulty)
            );
            break;

        case 2:
            level.platforms.push(
                { x: 100, y: 400, width: 100, height: 20 },
                { x: 280, y: 350, width: 130, height: 20 },
                { x: 480, y: 300, width: 100, height: 20 },
                { x: 650, y: 400, width: 120, height: 20 },
                { x: 820, y: 340, width: 100, height: 20 }
            );
            // Introduce DrumTrolls
            level.enemies.push(
                createEnemy('singer', 250, 450, difficulty),
                createEnemy('drumtroll', 500, 450, difficulty),
                createEnemy('singer', 750, 450, difficulty)
            );
            break;

        case 3:
            level.platforms.push(
                { x: 80, y: 420, width: 100, height: 20 },
                { x: 250, y: 360, width: 120, height: 20 },
                { x: 420, y: 300, width: 130, height: 20 },
                { x: 600, y: 380, width: 100, height: 20 },
                { x: 760, y: 280, width: 140, height: 20 },
                { x: 400, y: 440, width: 80, height: 20 }
            );
            // Introduce bats
            const bats3 = createBatFormation(500, 150, 3, difficulty);
            level.enemies.push(
                createEnemy('singer', 200, 450, difficulty),
                createEnemy('drumtroll', 650, 450, difficulty),
                ...bats3
            );
            break;

        case 4:
            level.platforms.push(
                { x: 60, y: 400, width: 100, height: 20 },
                { x: 200, y: 340, width: 80, height: 20 },
                { x: 350, y: 400, width: 100, height: 20 },
                { x: 500, y: 320, width: 120, height: 20 },
                { x: 680, y: 380, width: 100, height: 20 },
                { x: 830, y: 300, width: 100, height: 20 }
            );
            // Introduce Metronome
            level.enemies.push(
                createEnemy('metronome', 350, 350, difficulty),
                createEnemy('singer', 200, 450, difficulty),
                createEnemy('drumtroll', 700, 450, difficulty),
                createEnemy('singer', 850, 450, difficulty)
            );
            break;

        case 5:
            level.platforms.push(
                { x: 80, y: 420, width: 120, height: 20 },
                { x: 250, y: 350, width: 100, height: 20 },
                { x: 400, y: 280, width: 140, height: 20 },
                { x: 600, y: 350, width: 100, height: 20 },
                { x: 750, y: 420, width: 120, height: 20 },
                { x: 450, y: 440, width: 80, height: 20 }
            );
            // Introduce Conductor
            const bats5 = createBatFormation(700, 120, 4, difficulty);
            level.enemies.push(
                createEnemy('conductor', 450, 150, difficulty),
                createEnemy('metronome', 250, 300, difficulty),
                createEnemy('drumtroll', 600, 450, difficulty),
                ...bats5
            );
            break;

        case 6:
            level.platforms.push(
                { x: 50, y: 400, width: 80, height: 20 },
                { x: 180, y: 330, width: 100, height: 20 },
                { x: 340, y: 270, width: 80, height: 20 },
                { x: 470, y: 350, width: 100, height: 20 },
                { x: 620, y: 290, width: 120, height: 20 },
                { x: 800, y: 370, width: 100, height: 20 },
                { x: 300, y: 440, width: 80, height: 20 }
            );
            // Full mix - strategic formations
            const bats6 = createBatFormation(300, 100, 5, difficulty);
            level.enemies.push(
                createEnemy('conductor', 650, 130, difficulty),
                createEnemy('metronome', 180, 280, difficulty),
                createEnemy('metronome', 800, 320, difficulty),
                createEnemy('drumtroll', 450, 450, difficulty),
                createEnemy('singer', 750, 450, difficulty),
                ...bats6
            );
            break;

        default:
            // Procedural levels beyond 6 - harder mixes
            level.platforms.push(
                { x: 60, y: 410, width: 90, height: 20 },
                { x: 200, y: 340, width: 100, height: 20 },
                { x: 370, y: 280, width: 90, height: 20 },
                { x: 520, y: 360, width: 110, height: 20 },
                { x: 690, y: 300, width: 100, height: 20 },
                { x: 840, y: 380, width: 90, height: 20 },
                { x: 430, y: 440, width: 80, height: 20 }
            );
            const batsN = createBatFormation(400 + Math.random() * 200, 80 + Math.random() * 60, Math.min(6, 3 + levelNumber - 5), difficulty);
            level.enemies.push(
                createEnemy('conductor', 200 + Math.random() * 500, 120, difficulty),
                createEnemy('metronome', 150 + Math.random() * 300, 250, difficulty),
                createEnemy('metronome', 500 + Math.random() * 300, 320, difficulty),
                createEnemy('drumtroll', 300 + Math.random() * 300, 450, difficulty),
                createEnemy('drumtroll', 600 + Math.random() * 200, 450, difficulty),
                createEnemy('singer', 100 + Math.random() * 200, 450, difficulty),
                createEnemy('singer', 700 + Math.random() * 150, 450, difficulty),
                ...batsN
            );
            break;
    }

    return level;
}

function getLevelBackground(level) {
    const backgrounds = [
        { top: '#1a1a3e', bottom: '#2d1b69', name: 'Concert Hall' },
        { top: '#1a2e1a', bottom: '#2b4c2b', name: 'Garden Stage' },
        { top: '#2e1a1a', bottom: '#4c2b2b', name: 'Opera House' },
        { top: '#1a2e3e', bottom: '#1b4569', name: 'Cathedral' },
        { top: '#3e1a3e', bottom: '#691b69', name: "Conductor's Lair" },
        { top: '#2e2e1a', bottom: '#4c4c1b', name: 'Grand Finale Stage' }
    ];
    return backgrounds[(level - 1) % backgrounds.length];
}
