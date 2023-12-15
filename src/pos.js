export class Pos extends Array {
  constructor(pos = []) {
    super(...pos)
  }

  // 
  // methods assumes positions have same dimensions

  slide(offset) {
    this.map((val, dim) => val + offset[dim])
    return this
  }

  slideFactor(factor) {
    this.map((val, _) => val + factor)
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

  multiply(other) {
    this.map((val, dim) => val * other[dim])
    return this
  }

  divide(other) {
    this.map((val, dim) => val / other[dim])
    return this
  }

  divideFactor(factor) {
    this.map((val, _) => val / factor)
    return this
  }

  invert() {
    this.map((val, _) => 1 / val)
    return this
  }

  mod(bounds) {
    this.map((val, i) => val % bounds[i])
    return this
  }
  
  mod1() {
    this.map((val, _) => {
      val = val % 1
      if (val >= 0) return val
      return val + 1
    })
    return this
  }

  modFactor(range) {
    this.map((val, _) => val % range)
    return this
  }

  wrap(bounds) {
    this
      .add(bounds)
      .mod(bounds)
    return this
  }

  add(other) {
    this.slide(other)
    return this
  }

  subtract(other) {
    this.map((val, dim) => val - other[dim])
    return this
  }

  normalize() {
    this.divideFactor(this.magnitude())
    return this
  }
  
  round() {
    this.map((val, _) => Math.round(val))
    return this
  }

  floor() {
    this.map((val, _) => Math.floor(val))
    return this
  }

  delta(other, offset) {
    this.map((val, i) => other[i] + offset[i] - val)
    return this
  }

  zero() {
    this.fill(0)
    return this
  }

  distance(other, offset) {
    return this.copy()
      .delta(other, offset)
      .magnitude()
  }

  direction(other) {
    return Math.atan2(other.y - this.y, other.x - this.x)
  }

  magnitude() {
    let sum = 0
    this.each(val => sum += val ** 2)
    return sum ** .5
  }

  sum() {
    let sum = 0
    this.each(val => sum += val)
    return sum
  }

  //
  // HELPERS

  copy() {
    return new Pos([...this])
  }
  
  map(func) {
    this.each((val, i) => this[i] = func(val, i))
    return this
  }

  each(callback) {
    for (let i = 0; i < this.length; i++) {
      callback(this[i], i)
    }
    return this
  }

  toString() {
    return `(${this.join(", ")})`
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