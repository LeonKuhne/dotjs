import { Particle } from './particle.js'
import { Position } from './position.js'
import { Vector } from './vector.js'

// particle engine
export class Engine {
  constructor(canvas, fps = 60, tps = 60) {
    this.particles = []
    this.drawDelay = 1000 / fps
    this.tickDelay = 1000 / tps
    this.canvas = canvas
    this.batchSize = 0
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
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const screenSize = this.screenSize()
    const borderSize = this.borderSize()
    ctx.beginPath()

    // draw particles
    for (let particle of this.particles) {
      particle.draw(ctx, borderSize, screenSize, this.color)
    }

    // 0.04ms draw only portions of frame that are needed
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        if (x == 0 && y == 0) { continue }
        // calculate position
        const pos = new Position([x, y])
          .multiply(screenSize)
          .slide(borderSize)
        // draw frame
        ctx.drawImage(canvas, 
          borderSize.x, borderSize.y, screenSize.x, screenSize.y,
          pos.x, pos.y, screenSize.x, screenSize.y)
      }
    }

    // stamp
    ctx.stroke()
  }

  applyForces(pos, i, j) {
    return pos
      .slideMany([
        // attract to other particles
        new Vector(this.particles[i], this.particles[j])
          .usingDistance(this.distanceFunc)
          .gravitate(this.antigravity, this.minInteractDistance)
          .delta,
      ])
  }

  runBatch(size) {
    let deltas = {}
    const rand = () => Math.floor(Math.random() * this.particles.length)
    for (let batch = 0; batch < size; batch++) {
      let [i, j] = [rand(), rand()]
      //if (i == j) { continue }
      if (deltas[i] == null) { deltas[i] = new Position([0, 0]) }
      if (deltas[j] == null) { deltas[j] = new Position([0, 0]) }
      deltas[i] = this.applyForces(deltas[i], i, j)
      deltas[j] = this.applyForces(deltas[j].scale(-1), i, j)
    }
    return deltas
  }

  runOrdered() {
    // setup deltas
    let deltas = {}
    for (let i = 0; i < this.particles.length; i++) {
      deltas[i] = new Position([0, 0])
    }
    // fill deltas
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = 0; j < this.particles.length; j++) {
        if (i == j) { continue }
        deltas[i] = this.applyForces(deltas[i], i, j)
        //deltas[j] = this.applyForces(deltas[j].scale(-1), i, j)
      }
    }
    return deltas
  }


  tick() {
    // pause
    if (this.paused) { return }

    // calculate deltas
    const deltas = this.batchSize == 0 
      ? this.runOrdered()
      : this.runBatch(this.batchSize)

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