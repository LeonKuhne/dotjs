import { Particle } from './particle.js'
import { Pos } from './pos.js'
import { Vector } from './vector.js'
import { Grid } from './grid.js'

// particle engine
export class Engine {
  constructor(canvas, fps = 60, tps = 60) {
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
    this.speed = 0.005
    this.wrap = true
    this.gravityCurve = 0.03
    this.antigravity = 0.05
    this.airFriction = 0
    this.heatSpeed = 0
    this.minInteractDistance = 1
    this.color = (particle) => particle.spin
      .map((spin) => Math.floor(spin * 255))
      .fill(0, 3) // fill with black
    this.paused = true
    this.distanceFunc = Vector.euclideanDistance
    this.screenFill = 2/3
    this.grid = new Grid(canvas, 30)
  }

  add(spin, pos=new Pos([Math.random(), Math.random()])) {
    this.grid.track(new Particle(spin, pos))
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

  // in pixels
  screenSize() {
    return new Pos([
      this.canvas.width * this.screenFill,
      this.canvas.height * this.screenFill,
    ])
  }

  // in pixels
  borderSize() {
    const screenSize = this.screenSize()
    return new Pos([
      (this.canvas.width - screenSize.x) / 2,
      (this.canvas.height - screenSize.y) / 2,
    ])
  }

  draw(ctx) {
    const screenSize = this.screenSize()
    const borderSize = this.borderSize()
    ctx.beginPath()

    // draw particles
    ctx.clearRect(borderSize.x, borderSize.y, screenSize.x, screenSize.y)
    this.grid.draw(borderSize, screenSize)

    // 0.033ms draw only portions of frame that are needed
    setTimeout(() => {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          if (x == 0 && y == 0) { continue }
          // calculate position
          const pos = new Pos([x, y])
            .multiply(screenSize)
            .slide(borderSize)
          // draw frame
          ctx.clearRect(pos.x, pos.y, screenSize.x, screenSize.y)
          ctx.drawImage(this.canvas, 
            borderSize.x, borderSize.y, screenSize.x, screenSize.y,
            pos.x, pos.y, screenSize.x, screenSize.y)
        }
      }
    }, 0)

    // stamp
    ctx.stroke()
  }

  tick() {
    if (this.paused) { return }
    this.grid.applyForces(this.airFriction, this.heatSpeed, this.wrap, this.speed)
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
}