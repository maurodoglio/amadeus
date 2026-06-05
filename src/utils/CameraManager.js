import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Sets up an improved camera with dead zone, smooth follow, and look-ahead.
 * Call in each level scene's create() after spawning the player.
 */
export function setupCamera(scene, target, worldWidth) {
  const cam = scene.cameras.main;
  cam.setBounds(0, 0, worldWidth, GAME_HEIGHT);

  // Dead zone — small movements don't jerk the camera
  cam.setDeadzone(80, 60);

  // Smooth follow with lerp
  cam.startFollow(target, true, 0.08, 0.12);

  // Follow offset for look-ahead (updated each frame)
  scene._cameraLookAheadX = 0;

  return cam;
}

/**
 * Update camera look-ahead based on player velocity direction.
 * Call in each level scene's update().
 */
export function updateCameraLookAhead(scene, target) {
  if (!target || !target.body) return;

  const cam = scene.cameras.main;
  const lookAheadMax = 50;
  const lerpSpeed = 0.05;

  // Target look-ahead based on movement direction
  let desiredOffset = 0;
  if (target.body.velocity.x > 20) {
    desiredOffset = lookAheadMax;
  } else if (target.body.velocity.x < -20) {
    desiredOffset = -lookAheadMax;
  }

  // Smooth interpolation
  scene._cameraLookAheadX = scene._cameraLookAheadX || 0;
  scene._cameraLookAheadX += (desiredOffset - scene._cameraLookAheadX) * lerpSpeed;

  cam.setFollowOffset(-scene._cameraLookAheadX, 0);
}

/**
 * Sets up co-op camera following the midpoint of two players.
 */
export function setupCoopCamera(scene, cameraTarget, worldWidth) {
  const cam = scene.cameras.main;
  cam.setBounds(0, 0, worldWidth, GAME_HEIGHT);
  cam.setDeadzone(80, 60);
  cam.startFollow(cameraTarget, true, 0.08, 0.12);
  return cam;
}
