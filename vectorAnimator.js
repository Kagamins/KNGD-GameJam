// Vector Animation Script - Computes joint and mesh offsets for bipedal island reptiles
// v2: smoother easing, weight-shift lean, speed-scaled arm swing, landing squash/stretch.
export class VectorAnimator {
  static getOffsets(entity, time) {
    const vx = entity.vx || 0;
    const vy = entity.vy || 0;
    const z = entity.z || 0;
    const vz = entity.vz || 0;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const isMoving = speed > 0.1;
    const isJumping = z > 0.1;

    // Track per-entity landing state for a satisfying squash/stretch pop
    if (entity._wasAirborne === undefined) entity._wasAirborne = false;
    if (entity._landSquashTimer === undefined) entity._landSquashTimer = 0;
    if (isJumping) {
      entity._wasAirborne = true;
    } else if (entity._wasAirborne) {
      entity._wasAirborne = false;
      entity._landSquashTimer = 8; // frames of squash after touchdown
    }
    if (entity._landSquashTimer > 0) entity._landSquashTimer--;

    let legAngle1 = 0;
    let legAngle2 = 0;
    let bobY = 0;
    let scaleY = 1.0;
    let headBob = 0;
    let tailWiggle = 0;
    let armAngle1 = 0;
    let armAngle2 = 0;
    let leanAngle = 0;      // gentle forward/side lean while moving (island stride)
    let stepPhase = 0;      // 0..1, useful for syncing footstep dust/sfx

    if (isJumping) {
      // --- HOP / LEAP CYCLE ---
      const ascending = vz > 0;
      legAngle1 = ascending ? 0.55 : 0.25;
      legAngle2 = ascending ? -0.55 : -0.25;
      bobY = -2 - Math.min(z, 20) * 0.05;
      scaleY = ascending ? 1.10 : 1.04; // stretch on the way up, ease on the way down
      headBob = -2;
      tailWiggle = Math.sin(time * 0.05) * 3;
      armAngle1 = -0.85;
      armAngle2 = 0.85;
      leanAngle = ascending ? -0.05 : 0.05;
    } else if (entity._landSquashTimer > 0) {
      // --- TOUCHDOWN SQUASH (short, springy settle into the sand) ---
      const t = entity._landSquashTimer / 8; // 1 -> 0
      scaleY = 1.0 - t * 0.18;
      bobY = t * 1.5;
      legAngle1 = 0.12 * t;
      legAngle2 = -0.12 * t;
      headBob = t * 1.2;
      tailWiggle = Math.sin(time * 0.05) * 3 * t;
    } else if (isMoving) {
      // --- WALK / JOG CYCLE ---
      // Ease speed into the stride frequency so starting/stopping feels weighted
      const strideSpeed = Math.min(speed, 2.2);
      const cycleTime = time * (strideSpeed * 0.115 + 0.02);
      const stride = Math.sin(cycleTime);
      const strideFast = Math.sin(cycleTime * 2);

      legAngle1 = stride * 0.5;
      legAngle2 = -stride * 0.5;
      bobY = Math.abs(strideFast) * 3.2;
      scaleY = 0.965 + Math.abs(strideFast) * 0.05;
      headBob = strideFast * 1.4;
      tailWiggle = Math.sin(cycleTime * 1.5) * (7 + strideSpeed * 2);

      // Arm counter-swing scales with how fast the entity is actually moving
      const armAmp = 0.25 + Math.min(strideSpeed / 2.2, 1) * 0.3;
      armAngle1 = -stride * armAmp;
      armAngle2 = stride * armAmp;

      // Subtle lean into the direction of travel — relaxed island gait rather than a stiff march
      leanAngle = Math.max(-0.12, Math.min(0.12, -vx * 0.045));

      // stepPhase pulses to 1 at each foot-plant (peaks of |strideFast|)
      stepPhase = Math.abs(strideFast);
    } else {
      // --- IDLE CYCLE (breathing, tail sway, sun-lazy sway) ---
      legAngle1 = 0.05;
      legAngle2 = -0.05;
      bobY = Math.sin(time * 0.045) * 0.9;
      scaleY = 1.0 + Math.sin(time * 0.055) * 0.028; // gentle breathing
      headBob = Math.sin(time * 0.05) * 1.1 + Math.sin(time * 0.017) * 0.4; // lazy double-period drift
      tailWiggle = Math.sin(time * 0.035) * 4.5;
      armAngle1 = Math.sin(time * 0.028) * 0.09;
      armAngle2 = -Math.sin(time * 0.028) * 0.09;
      leanAngle = Math.sin(time * 0.02) * 0.02; // barely-there idle sway
    }

    return {
      legAngle1,
      legAngle2,
      bobY,
      scaleY,
      headBob,
      tailWiggle,
      armAngle1,
      armAngle2,
      leanAngle,
      stepPhase
    };
  }
}
