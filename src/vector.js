import { Position } from "./position.js"

export class Vector {
  constructor(start, end) {
    this.start = start
    this.end = end
    this.delta = new Position([0, 0])
    this.wallForce = 0.01
    this.distanceFunc = this.euclideanDistance
  }

  static euclideanDistance(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2)
  }

  usingDistance(distanceFunc) {
    this.distanceFunc = distanceFunc
    return this 
  }

  add(distance, direction) {
    this.delta.slide(new Position([
      Math.cos(direction) * distance,
      Math.sin(direction) * distance,
    ]))
    return this
  }

  gravitate(strength=0.05, curve=1, minDistance=0.2) {
    this.forSpaces(1, space => {
      const distance = this.distanceFunc(this.start, space)
      if (distance > minDistance) { return }
      const direction = this.start.direction(space)
      // reverse distance if strength is negative
      let negate = strength < 0
      if (negate) strength = -strength
      let gravity = Math.pow((strength / distance), curve)
      //const gravity = strength * (1 - Math.pow(distance, 2))
      //const gravity = strength / Math.tan(distance - Math.PI / 2 - .5)
      //const gravity = strength * (1 - Math.pow(distance, radius))
      // check if gravity is nan
      if (negate) gravity = -gravity
      this.add(-gravity, direction)
    })
    return this
  }

  antiwall() {
    // get distance from walls
    const left = this.start.x 
    const top = this.start.y
    // add force to move away from walls
    if (left < .5) this.add(left * this.wallForce, 0)
    else this.add((1 - left) * this.wallForce, Math.PI)
    if (top < .5) this.add(top * this.wallForce, Math.PI / 2)
    else this.add((1 - top) * this.wallForce, Math.PI * 3 / 2)  
    return this
  }

  forSpaces(spaces, callback) {
    for (let x = -spaces; x < spaces+1; x++) {
      for (let y = -spaces; y < spaces+1; y++) {
        callback(this.end.copy().slide(new Position([x, y])))
      }
    }
    return this
  }
}