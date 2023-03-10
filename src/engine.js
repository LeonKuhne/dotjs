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
    this.spaceDepth = 0 // simulate this many mirrored neighboring spaces
    this.speed = 0.005
    this.wrap = false
    this.centerGravity = 0.00000000000000001
    this.gravityCurve = 0.03
    this.antigravity = 0.05
    this.center = new Particle(0, [0.5, 0.5])
    this.color = (particle) => particle.spin
      .map((spin) => Math.floor(spin * 255))
      .fill(0, 3) // fill with black
    this.paused = true
  }

  add(spin, position=[Math.random(), Math.random()]) {
    this.particles.push(new Particle(spin, position))
  }

  run() {
    this.paused = false
    // draw
    const ctx = this.canvas.getContext('2d')
    const draw = () => {
      this.draw(ctx, this.canvas.width, this.canvas.height)
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

  draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h)
    ctx.beginPath()
    for (let particle of this.particles) {
      particle.draw(ctx, w, h, this.color)
    }
    ctx.stroke()
  }

  applyForces(pos, i, j) {
    return pos
      .slideMany([
        // attract to other particles
        new Vector(this.particles[i], this.particles[j])
          .attract(this.spaceDepth)
          .gravitate(this.antigravity)
          // repel from walls
          .antiwall()
          .delta,
        // attract to center
        /*
        new Vector(this.particles[i], this.center)
          .gravitate(-this.centerGravity, this.gravityCurve)
          .delta,
        */
      ])
  }

  runBatch(size) {
    let deltas = {}
    const rand = () => Math.floor(Math.random() * this.particles.length)
    for (let batch = 0; batch < size; batch++) {
      let [i, j] = [rand(), rand()]
      if (i == j) { continue }
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