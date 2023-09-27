import { Pos } from './pos.js'
import { Force } from './force.js'
import { Vector } from './vector.js'

export class Particle extends Pos {
  static count = 0
  // spin can be either a number or a list of numbers
  // pos only 2 dimensions currently supported
  constructor(
    spin = 0.5,
    pos = new Pos([0.5, 0.5]),
  ) {
    super(pos)
    this.id = Particle.count++
    this.force = new Force(new Pos([0, 0]))
    // features
    this.spin = spin
    this.size = 8
    this.heat = 0.5
    this.friction = 0.1
    this.antigravity = 0.05
    this.minInteractDistance = 1
    this.updateColor()
  }

  updateColor() {
    this.color = this.spin
      .map((spin) => Math.floor(spin * 255))
      // limit to 3 elements, fill with black
      .fill(0, 3) .slice(0, 3) 
      // convert to hex
      .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '#')
  }

  draw(ctx, borderSize, screenSize, color=null) {
    ctx.fillStyle = color || this.color
    const offset = this.copy().multiply(screenSize)
    const pos = offset.copy().slide(borderSize)
    this._drawParticle(ctx, pos.x, pos.y)
    // duplicate on top if near bottom
    /*
    if (offset.y + this.size > screenSize.y) {
      this._drawParticle(ctx, pos.x, borderSize.y + (this.y - 1) * screenSize.y)
    }
    // duplicate on left if near right
    if (offset.x + this.size > screenSize.x) {
      this._drawParticle(ctx, borderSize.x + (this.x - 1) * screenSize.x, pos.y)
    }
    */
  }

  draw_from_erode(ctx, zone, particleSize, color=null) {
    if (!color) {
      color = this.feat('color')
      const red = Math.floor((this.feat("heat") + 1) / 2 * 256)
      ctx.fillStyle = `rgb(${red}, ${color[1]}, ${color[2]})`
    } else {
      ctx.fillStyle = color
    }
    const x = zone.x + this.x - particleSize/2 - .5
    const y = zone.y + this.y - particleSize/2 - .5
    ctx.fillRect(x, y, particleSize, particleSize)
  }

  attract_from_erode(other, offset, amount) {
    const delta = other.copy()
    delta.add(offset)
    delta.subtract(this)
    delta.normalize()
    delta.multiply(amount)
    delta.multiply(this.feat('mass') / other.feat('mass'))
    delta.multiply(this.feat('heat') / other.feat('heat'))
    delta.multiply(1 - this.feat("friction"))
    other.forceQueue.subtract(delta)
  }

  // onedirectional
  react(other, distanceFunc) {
    const delta = new Vector(this, other)
      .usingDistance(distanceFunc)
      .gravitate(this.antigravity, this.minInteractDistance)
    this.force.slide(delta)
  }

  apply(airFriction, heatSpeed, wrap, speed) {
    this.force.scale(speed)
    this.force.applyVelocity(this, this.friction, airFriction)
    this.force.applyHeat(this, heatSpeed)
    this.force.reset()
    wrap ? this.wrap() : this.collideBounds()
  }

  spinDelta(other) { 
    return Particle.SpinDelta(this, other)
  }

  // between 0 and 1, 0.5 means no attraction/repulsion
  // expects same length spin vectors
  static SpinDelta(particle, other) {
    let sum = 0
    particle.spin.each((val, i) => {
      sum += Math.abs(other.spin[i] - val) / 2
    })
    return sum / particle.spin.length
  }

  wrap(range=1) {
    this.map((val, _) => {
      if (val <= 0) return val + range 
      return val % range
    })
  }

  collideBounds(range=1) {
    this.map((val, _) => {
      if (val < 0) return 0
      if (val > range) return range
      return val
    })
  }

  copy() {
    return new Particle([...this.spin], new Pos([...this]))
  }

  _drawParticle(ctx, x, y) {
    ctx.fillRect(x, y, this.size, this.size)
  }
}
