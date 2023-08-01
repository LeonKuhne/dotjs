import { Position } from './position.js'

export class Particle extends Position {
  // spin can be either a number or a list of numbers
  // pos only 2 dimensions currently supported
  constructor(
    spin = 0.5,
    pos = [0.5, 0.5],
  ) {
    super(pos)
    this.spin = spin
    this.size = 8
  }

  draw(ctx, w, h, color=(_) => [150,150,150]) {
    ctx.fillStyle = `rgb(${color(this).join(',')})`
    ctx.fillRect(this.x * w, this.y * h, this.size, this.size)
    if (this.y + this.size / h > 1) { // draw on top if near bottom
      ctx.fillRect(this.x * w, (this.y - 1) * h, this.size, this.size)
    }
    if (this.x + this.size / w > 1) { // draw on left if near right
      ctx.fillRect((this.x - 1) * w, this.y * h, this.size, this.size)
    }
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
    return new Particle([...this.spin], [...this.pos])
  }
}
