import { Pos } from './pos.js'
import { Timer } from './timer.js'

export class Particle extends Pos {
  static count = 0
  // spin can be either a number or a list of numbers
  // pos only 2 dimensions currently supported
  constructor(spin = 0.5, pos = new Pos([0.5, 0.5])) {
    super(pos)
    this.id = Particle.count++
    this.force = new Pos([0, 0])
    this.velocity = new Pos([0, 0])
    // features
    this.spin = spin
    this.size = 8
    this.halfSize = this.size / 2
    this.heat = 0.5
    this.friction = 0.001
    this.wallForce = 0.01
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

  draw(ctx, zoneOffset, zoneSize, color=null) {
    ctx.fillStyle = color || this.color
    const pos = this.copy()
      .scale(zoneSize)
      .slide(zoneOffset)
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

  tick(airFriction, heatSpeed, maxSpeed=0.01) {
    this.applyFriction(airFriction)
    this.applyHeat(heatSpeed)
    // limit speed (TODO use log or something smooth that works with inifinity)
    this.velocity.map((val, _) => Math.min(Math.max(-maxSpeed, val), maxSpeed))
    this.velocity.slide(this.force)
    this.slide(this.velocity)
    this.force.zero()
  }

  applyHeat(speed) {
    const impact = this.magnitude() / Math.sqrt(2)
    const heat = this.heat
    this.heat = Math.tanh(heat + (impact * 2 - 1) * speed)
  }

  applyFriction(airFriction) {
    this.velocity.scale((1 - this.friction) * (1 - airFriction))
  }

  //
  // FORCES
  
  applyJitter(amount=0.01) {
    const jitter = (Math.random() - .5) * amount
    this.force.slide(new Pos([jitter, jitter]))
  }

  applyGravity(other, delta, distance, strength=0.05, curve=1) {
    const timer = Timer.instance('particle.applyGravity').start()
    let spin = this.spinDelta(other) * 2 - 1
    let gravity = Math.pow((spin * strength / distance), curve)
    //const gravity = strength * (1 - Math.pow(distance, 2))
    //const gravity = strength / Math.tan(distance - Math.PI / 2 - .5)
    //const gravity = strength * (1 - Math.pow(distance, radius))
    this.force.slide(delta.scale(gravity * spin))
    timer.end()
  }

  /*
  applyAntiwall() {
    // get distance from walls
    const left = this.x 
    const top = this.y
    // add force to move away from walls
    if (left < .5) this.force.slide([left * this.wallForce, 0])
    else this.force.slide([(1 - left) * this.wallForce, Math.PI])
    if (top < .5) this.force.slide([top * this.wallForce, Math.PI / 2])
    else this.force slide([(1 - top) * this.wallForce, Math.PI * 3 / 2])  
  }
  */

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

  copy() {
    return new Particle([...this.spin], new Pos([...this]))
  }

  _drawParticle(ctx, x, y) {
    ctx.fillRect(x-this.halfSize, y-this.halfSize, this.size, this.size)
  }
}
