export class Position {
  constructor(pos = []) {
    this.pos = pos;
  }

  direction(other) {
    return Math.atan2(other.y - this.y, other.x - this.x)
  }

  slide(offset) {
    for (let i = 0; i < this.pos.length; i++) {
      this.pos[i] += offset.pos[i]
    }
    return this
  }

  slideMany(offsets) {
    for (let offset of offsets) {
      this.slide(offset)
    }
    return this
  }

  scale(factor) {
    for (let i = 0; i < this.pos.length; i++) {
      this.pos[i] *= factor
    }
    return this
  }

  copy() {
    return new Position([...this.pos])
  }

  get x() { return this.pos[0] }
  get y() { return this.pos[1] }
}
