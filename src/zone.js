import { Pos } from "./pos.js"

export class Zone extends Pos {
  constructor(col, row) {
    super([col, row])
    this.particles = []
    this.color = () => [Math.random() * 255, Math.random() * 255, Math.random() * 255]
  }

  draw(ctx, zoneSize, borderSize, screenSize) {
    const globalPos = this.copy().multiply(zoneSize)
    ctx.font = "18px Arial"
    ctx.strokeStyle = this.color
    ctx.fillStyle = this.color
    ctx.strokeRect(globalPos.x-.5, globalPos.y-.5, zoneSize.x-.5, zoneSize.y-.5)
    ctx.fillText(this.particles.length, globalPos.x-.5 + zoneSize/3, globalPos.y-.5 + zoneSize*3/4)
    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, borderSize, screenSize, this.color)
    }
  }

  insert(particle) {
    this.particles.push(particle)
  }

  toString() {
    return `table: ${super.toString()}, pos: ${this.absPos.toString()}, size: ${this.size}`
  }
}