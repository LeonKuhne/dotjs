import { Pos } from "./pos.js"

export class Zone extends Pos {
  constructor(col, row) {
    super([col, row])
    this.particles = []
    this.color = "#aaaaaa"
  }

  clear(ctx, offset, gridSize) {
    const pos = this.copy()
      .scale(gridSize)
      .slide(offset)
      .slideFactor(-0.5) // align to grid
    const size = gridSize - 0.5 // align to grid
    // clear square
    ctx.clearRect(pos.x, pos.y, size, size)
    ctx.fillStyle = "#000000"
    ctx.fillRect(pos.x, pos.y, size, size)
    // draw border
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.strokeRect(pos.x, pos.y, size, size)
    // draw particle count
    ctx.font = "18px Arial"
    ctx.fillText(this.particles.length, pos.x + size/3, pos.y + size*3/4)
  }

  draw(ctx, paneOffset, zoneSize) {
    const zoneOffset = this.copy()
      .scale(zoneSize)
      .slide(paneOffset)
    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, zoneOffset, zoneSize)
    }
  }

  insert(particle) {
    this.particles.push(particle)
  }

  toString() {
    return `table: ${super.toString()}, pos: ${this.absPos.toString()}, size: ${this.size}`
  }
}