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

  // compute delta of spin between two spin values
  static spinAttraction(a, b, fill=0.5) {
    if (isNaN(a) || isNaN(b)) { return fill }
    return Math.abs(b - a)
    //return a > b ? Math.pow((a-b), 2) : Math.pow((b-a), 2)
    //return ((this.spin[i] - other.spin[i]) / 2) ** 2
    //return (Math.abs(this.spin[i] - other.spin[i]) / 2
  }

  // aka. repulsion/attraction force (-1, 1)
  spinDelta(other) { 
    let sum = 0
    for (let i = 0; i < this.spin.length; i++) {
      sum += Particle.spinAttraction(this.spin[i], other.spin[i])
    }
    return sum / this.spin.length
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
