import { Particle } from './particle.js'
import { Pos } from './pos.js'
import { Grid } from './grid.js'

// particle engine
export class Engine {
  constructor(canvas, fps = 60, tps = 60) {
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
    this.speed = 0.05
    this.gravityCurve = 0.03
    this.antigravity = 0.05
    this.airFriction = 0.005
    this.heatSpeed = 0
    this.paused = true
    this.screenFill = 2/3
    this.grid = new Grid(canvas, 30, Engine.euclideanDistance)
    this.canvas.addEventListener('resize', () => this.resize())
    this.resize()
  }

  add(spin, pos=new Pos([Math.random(), Math.random()])) {
    this.grid.track(new Particle(spin, pos))
  }

  resize() {
    this.grid.resize(this.paneSize)
  }

  run() {
    this.paused = false
    // draw
    const ctx = this.canvas.getContext('2d')
    const draw = () => {
      this.draw(ctx)
      setTimeout(() => requestAnimationFrame(draw), this.drawDelay)
    }
    requestAnimationFrame(draw)
    // run
    const run = () => {
      this.tick()
      setTimeout(run, this.tickDelay)
    }
    // dispatch
    run()
  }

  get canvasSize() { return new Pos([this.canvas.width, this.canvas.height]) }
  get paneSize() { return this.canvasSize.scale(this.screenFill).round() }
  get paneOffset() { return this.canvasSize.scale((1 - this.screenFill) / 2).round() }

  draw(ctx) {
    ctx.beginPath()

    // draw particles
    this.grid.draw(this.paneOffset)

    // duplicate to sides
    // 0.033ms draw only portions of frame that are needed
    /* 
    setTimeout(() => {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          if (x == 0 && y == 0) { continue }
          // calculate position
          const pos = new Pos([x, y])
            .multiply(paneSize)
            .slide(paneOffset)
          // draw frame
          ctx.clearRect(pos.x, pos.y, paneSize.x, paneSize.y)
          ctx.drawImage(this.canvas, 
            paneOffset.x, paneOffset.y, paneSize.x, paneSize.y,
            pos.x, pos.y, paneSize.x, paneSize.y)
        }
      }
    }, 0)
    */

    // stamp
    ctx.stroke()
  }

  tick() {
    if (this.paused) { return }
    this.grid.tick(this.antigravity, this.airFriction, this.heatSpeed, this.speed)
  }

  // 
  // UTIL

  get log() {
    let str = `Particles (${this.particles.length}):\n`
    for (let particle of this.particles) {
      str += `  ${particle.pos}\n`
    }
    return str
  }

  toggle() {
    this.paused = !this.paused
  }

  reset() {
    this.particles = []
  }

  static euclideanDistance(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2)
  }
}