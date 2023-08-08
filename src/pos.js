export class Pos extends Array {
  constructor(pos = []) {
    super(...pos)
  }

  slide(offset) {
    this.map((val, dim) => val + offset.pos[dim])
    return this
  }

  slideMany(offsets) {
    for (let offset of offsets) {
      this.slide(offset)
    }
    return this
  }

  scale(factor) {
    this.map((val, _) => val * factor)
    return this
  }

  // assumes positions have same dimensions
  multiply(other) {
    this.map((val, dim) => val * other.pos[dim])
    return this
  }

  invert() {
    this.map((val, _) => 1 / val)
    return this
  }

  mod(range) {
    this.map((val, _) => val % range)
    return this
  }

  add(other) {
    this.slide(other)
    return this
  }

  subtract(other) {
    this.map((val, dim) => val - other.pos[dim])
    return this
  }

  divide(factor) {
    this.map((val, _) => val / factor)
    return this
  }

  distance(other, offset) {
    this.map((val, i) => other.pos[i] + offset.pos[i] - val)
    return this.magnitude()
  }

  direction(other) {
    return Math.atan2(other.y - this.y, other.x - this.x)
  }

  magnitude() {
    let sum = 0
    for (let val of this) {
      sum += val ** 2
    }
    return sum ** .5
  }

  normalize() {
    this.divide(this.magnitude())
  }

  //
  // HELPERS

  copy() {
    return new Pos([...this])
  }
  
  map(func) {
    for (let i = 0; i < this.length; i++) {
      this[i] = func(this[i], i)
    }
  }

  //
  // GET/SETTERS

  get x() { return this[0] }
  get y() { return this[1] }
  get z() { return this[2] }
  set x(x) { this[0] = x }
  set y(y) { this[1] = y }
  set z(z) { this[2] = z }
}