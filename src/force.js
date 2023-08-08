import { Pos } from './pos.js';

export class Force extends Pos {

  constructor(velocity) {
    super()
    this.vel = velocity
  }

  applyVelocity(particle, airFriction) {
    this.vel.add(this.forceQueue)
    this.vel.multiply(1 - airFriction)
    this.vel.multiply(1 - this.friction)
    particle.add(this.vel)
  }

  applyHeat(particle, speed) {
    const impact = this.forceQueue.diagonal()
    const heat = particle.heat
    particle.heat = Math.tanh(heat + (impact * 2 - 1) * speed)
  }

  reset() {
    this.fill(0)
  }
}