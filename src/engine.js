import { Particle } from './particle.js'
import { Position } from './position.js'
import { Vector } from './vector.js'
import { Timer } from './timer.js'

// particle engine
export class Engine {
  constructor(canvas, fps = 60, tps = 60) {
    this.particles = []
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
    this.speed = 0.005
    this.wrap = true
    this.gravityCurve = 0.03
    this.antigravity = 0.05
    this.minInteractDistance = 1
    this.color = (particle) => particle.spin
      .map((spin) => Math.floor(spin * 255))
      .fill(0, 3) // fill with black
    this.paused = true
    this.distanceFunc = Vector.euclideanDistance
    this.screenFill = 2/3
  }

  add(spin, position=new Position([Math.random(), Math.random()])) {
    this.particles.push(new Particle(spin, position))
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
    return new Position([
      this.canvas.width * this.screenFill,
      this.canvas.height * this.screenFill,
    ])
  }

  // in pixels
  borderSize() {
    const screenSize = this.screenSize()
    return new Position([
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
    for (let particle of this.particles) {
      particle.draw(ctx, borderSize, screenSize, this.color)
    }

    // 0.033ms draw only portions of frame that are needed
    setTimeout(() => {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          if (x == 0 && y == 0) { continue }
          // calculate position
          const pos = new Position([x, y])
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

  _forcesBetween(i, j) {
    return new Vector(this.particles[i], this.particles[j])
      .usingDistance(this.distanceFunc)
      .gravitate(this.antigravity, this.minInteractDistance)
      .delta
  }

  _particleDeltas() {
    // setup deltas
    let deltas = {}
    for (let i = 0; i < this.particles.length; i++) {
      deltas[i] = new Position([0, 0])
    }
    // fill deltas
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i+1; j < this.particles.length; j++) {
        if (i == j) { continue }
        const delta = this._forcesBetween(i, j)
        deltas[i].slide(delta)
        deltas[j].slide(delta.scale(-1))
      }
    }
    return deltas
  }

  tick() {
    // pause
    if (this.paused) { return }

    // calculate deltas
    const deltas = this._particleDeltas()

    // move
    for (let [i, delta] of Object.entries(deltas)) {
      // ignore nan deltas
      if (delta.x != delta.x || delta.y != delta.y) { continue }

      let particle = this.particles[i]
        .slide(delta.scale(this.speed))
      this.wrap ? particle.wrap() : particle.collideBounds()
    }
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
