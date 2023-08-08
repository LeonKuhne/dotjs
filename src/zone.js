import { Pos } from "./pos.js"

export class Zone extends Pos {
  constructor(col, row, size) {
    super(col * size, row * size)
    this.particles = []
    this.col = col
    this.row = row
    this.size = size
    this.color = "#aaaaaa"
  }

  fix(size) {
    this.x = this.col * size
    this.y = this.row * size
  }

  draw(ctx) {
    ctx.font = "18px Arial"
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.strokeRect(this.x-.5, this.y-.5, this.size-.5, this.size-.5)
    ctx.fillText(this.particles.length, this.x-.5 + this.size/3, this.y-.5 + this.size*3/4)
    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, borderSize, screenSize, this, this.color)
    }
  }

  add(particle) {
    this.particles.push(particle)
  }

  toString() {
    return `table: (${this.col},${this.row}), pos: (${this.pos.join(", ")}), size: ${this.size}`
  }
}