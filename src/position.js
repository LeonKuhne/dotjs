export class Position {
  constructor(pos = []) {
    this.pos = pos;
  }

  direction(other) {
    return Math.atan2(other.y - this.y, other.x - this.x)
  }

  slide(offset) {
    this._updateEach((val, dim) => val + offset.pos[dim])
    return this
  }

  slideMany(offsets) {
    for (let offset of offsets) {
      this.slide(offset)
    }
    return this
  }

  scale(factor) {
    this._updateEach((val, _) => val * factor)
    return this
  }

  // assumes positions have same dimensions
  multiply(other) {
    this._updateEach((val, dim) => val * other.pos[dim])
    return this
  }

  invert() {
    this._updateEach((val, _) => 1 / val)
    return this
  }

  mod(range) {
    this._updateEach((val, _) => val % range)
    return this
  }

  copy() {
    return new Position([...this.pos])
  }

  get x() { return this.pos[0] }
  get y() { return this.pos[1] }
  get z() { return this.pos[2] }

  float32Array() {
    return new Float32Array(this.pos)
  }

  _updateEach(func) {
    for (let i = 0; i < this.pos.length; i++) {
      this.pos[i] = func(this.pos[i], i)
    }
  }

}
