import { Pos } from "./pos.js"

export class Zone extends Pos {
  constructor(col, row) {
    super([col, row])
    this.particles = []
    this.color = "#aaaaaa"
  }

  draw(ctx, paneOffset, paneSize, gridSize) {
    // TODO only redraw the zone if it was updated
    const pos = this.copy()
      .scale(gridSize)
      .slide(paneOffset)
      .slideFactor(-0.5) // align to grid
    const size = gridSize - 0.5 // align to grid

    // clear zone
    ctx.clearRect(pos.x, pos.y, size.x, size.y)
    ctx.fillStyle = "#000000"
    ctx.fillRect(pos.x, pos.y, size.x, size.y)

    // draw zone border
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.strokeRect(pos.x, pos.y, size.x, size.y)

    // draw particle count
    ctx.font = "18px Arial"
    ctx.fillText(this.particles.length, pos.x + gridSize/3, pos.y + gridSize*3/4)
    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, paneOffset, paneSize)
    }
  }

  insert(particle) {
    this.particles.push(particle)
  }

  toString() {
    return `table: ${super.toString()}, pos: ${this.absPos.toString()}, size: ${this.size}`
  }
}