import { Pos } from "./pos.js"

export class Vector extends Pos {
  constructor(start, end) {
    super(new Array(start.length).fill(0))
    this.start = start
    this.end = end
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
    this.slide(new Pos([
      Math.cos(direction) * distance,
      Math.sin(direction) * distance,
    ]))
    return this
  }

  gravitate(strength=0.05, minDistance=1, curve=1) {
    this.forSpaces(1, space => {
      const distance = this.distanceFunc(this.start, space)
      if (distance > minDistance) { return }
      const spinDelta = this.start.spinDelta(this.end)
      if (spinDelta == 0.5) { return }
      let spin = spinDelta * 2 - 1
      const direction = this.start.direction(space)
      // reverse distance if strength is negative
      let negate = strength < 0
      if (negate) strength = -strength
      let gravity = Math.pow((strength / distance), curve)
      //const gravity = strength * (1 - Math.pow(distance, 2))
      //const gravity = strength / Math.tan(distance - Math.PI / 2 - .5)
      //const gravity = strength * (1 - Math.pow(distance, radius))
      // add spin
      gravity += spin
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
        callback(this.end.copy().slide(new Pos([x, y])))
      }
    }
    return this
  }
}