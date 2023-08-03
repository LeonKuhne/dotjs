import { Position } from './position.js'

export class Particle extends Position {
  // spin can be either a number or a list of numbers
  // pos only 2 dimensions currently supported
  constructor(
    spin = 0.5,
    pos = new Position([0.5, 0.5]),
  ) {
    super(pos.pos)
    this.spin = spin
    this.size = 8
  }

  draw(ctx, borderSize, screenSize, color=(_) => [150,150,150]) {
    ctx.fillStyle = `rgb(${color(this).join(',')})`
    const offset = this.copy().multiply(screenSize)
    const pos = offset.copy().slide(borderSize)
    // draw particle
    this._drawParticle(ctx, pos.x, pos.y)
    // draw on top if near bottom
    if (offset.y + this.size > screenSize.y) {
      this._drawParticle(ctx, pos.x, borderSize.y + (this.y - 1) * screenSize.y)
    }
    // draw on left if near right
    if (offset.x + this.size > screenSize.x) {
      this._drawParticle(ctx, borderSize.x + (this.x - 1) * screenSize.x, pos.y)
    }
  }

  _drawParticle(ctx, x, y) {
    ctx.fillRect(x, y, this.size, this.size)
  }

  spinDelta(other) { 
    return Particle.SpinDelta(this, other)
  }

  // between 0 and 1, 0.5 means no attraction/repulsion
  static SpinDelta(a, b) {
    let sum = 0
    for (let i = 0; i < a.spin.length; i++) {
      sum += Math.abs(b.spin[i] - a.spin[i]) / 2
    }
    return sum / a.spin.length
  }

  wrap(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] <= 0) { 
        this.pos[i] += range }
      else { this.pos[i] %= range }
    }
  }

  collideBounds(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] < 0) { this.pos[i] = 0 }
      else if (this.pos[i] > range) { this.pos[i] = range }
    }
  }

  copy() {
    return new Particle([...this.spin], new Position([...this.pos]))
  }
}
