// Top-down AABB collision and sliding physics module with 2.5D floor footprints
export class Physics {
  static checkAABB(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
  }

  // Get the narrow ground footprint of a wall structure to allow walking behind/in front
  static getFootprint(wall) {
    if (wall.isVehicle || wall.isLedge || wall.h <= 40) {
      return { x: wall.x, y: wall.y, w: wall.w, h: wall.h };
    }
    // Structural obstacles only collide at the top-most 20px slice
    return {
      x: wall.x,
      y: wall.y,
      w: wall.w,
      h: 20
    };
  }

  // Check if box overlaps with any wall footprints
  static checkWallCollision(x, y, w, h, walls) {
    for (let wall of walls) {
      const fp = Physics.getFootprint(wall);
      if (Physics.checkAABB(x, y, w, h, fp.x, fp.y, fp.w, fp.h)) {
        return true;
      }
    }
    return false;
  }

  // Resolve X-axis collision (stops vx and snaps entity to footprint boundary)
  static resolveCollisionsX(entity, walls) {
    for (let wall of walls) {
      const fp = Physics.getFootprint(wall);
      if (Physics.checkAABB(entity.x, entity.y, entity.width, entity.height, fp.x, fp.y, fp.w, fp.h)) {
        if (entity.vx > 0) {
          entity.x = fp.x - entity.width;
          entity.vx = 0;
        } else if (entity.vx < 0) {
          entity.x = fp.x + fp.w;
          entity.vx = 0;
        }
      }
    }
  }

  // Resolve Y-axis collision (stops vy and snaps entity to footprint boundary)
  static resolveCollisionsY(entity, walls) {
    for (let wall of walls) {
      const fp = Physics.getFootprint(wall);
      if (Physics.checkAABB(entity.x, entity.y, entity.width, entity.height, fp.x, fp.y, fp.w, fp.h)) {
        if (entity.vy > 0) {
          entity.y = fp.y - entity.height;
          entity.vy = 0;
        } else if (entity.vy < 0) {
          entity.y = fp.y + fp.h;
          entity.vy = 0;
        }
      }
    }
  }

  // Trace line segments and check footprint intersections
  static checkLineOfSight(x1, y1, x2, y2, walls) {
    const steps = 15;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      for (let wall of walls) {
        const fp = Physics.getFootprint(wall);
        if (px > fp.x && px < fp.x + fp.w && py > fp.y && py < fp.y + fp.h) {
          return false;
        }
      }
    }
    return true;
  }
}
