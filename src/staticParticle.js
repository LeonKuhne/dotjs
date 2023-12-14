import { Position } from "./position.js"


export class StaticParticle extends Position {
  static size = 8
  static color = '#969696' 

  constructor(
    pos = new Position([0.5, 0.5]),
  ) {
    super(pos.pos)
    this.spin = 0.5
    this.size = StaticParticle.size
  }

  draw(ctx, borderSize, screenSize) {
    ctx.fillStyle = self.color
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

  spinDelta(_) { 
    return .5
  }

  wrap(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] <= 0) { this.pos[i] += range }
      else { this.pos[i] %= range }
    }
  }

  collideBounds(range=1) {
    for (let i = 0; i < this.pos.length; i++) {
      if (this.pos[i] < 0) { this.pos[i] = 0 }
      else if (this.pos[i] > range) { this.pos[i] = range }
    }
  }
}