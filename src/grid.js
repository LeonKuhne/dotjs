import { Zone } from './zone.js'
import { Pos } from './pos.js'

export class Grid {

  constructor(canvas, gridSize) {
    this.gridSize = gridSize
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cells = new Pos([0, 0])
    this.zones = []
  }

  track(particle) {
    const zone = this.getZone(particle)
    zone.insert(particle)
  }

  resize(paneSize) {
    const newCells = paneSize.copy().map((val, _) => Math.ceil(val / this.gridSize))
    this.fixZones(newCells)
  }

  draw(offset, size) {
    this.eachZone(zone => zone.draw(this.ctx, offset, size, this.gridSize))
  }

  applyForces(airFriction, heatSpeed, wrap, speed) {
    // compute forces between particles
    this.pairs((particle, neighbor, _, offset, distance) => {
      neighbor = neighbor.copy().add(offset)
      particle.react(neighbor, offset, distance)
    })
    // apply forces to particles
    this.eachParticle((particle, zone) => {
      particle.apply(airFriction, heatSpeed, wrap, speed)
      this.applyParticleDeltas(particle, zone)
    })
  }

  applyParticleDeltas(particle, zone) {
    const particleZone = this.getZone(particle)
    // check for change
    if (particleZone.copy().subtract(zone).sum() > 0) {
      // remove from prev zone 
      const idx = zone.particles.indexOf(particle)
      zone.particles.splice(idx, 1)
      // add to new zone
      particleZone.insert(particle)
    }
  }

  // 
  // GRID RESIZING

  fixZones(newCells) {
    console.info("fixing zones")
    const oldCells = this.cells.copy()
    if (this.cells.x != newCells.x) this.fixCols(newCells.x)
    if (this.cells.y != newCells.y) this.fixRows(newCells.y) 
    // TODO remove this check once we're sure it works
    if (this.cells.x != this.zones.length || this.zones && this.cells.y != this.zones[0].length) {
      console.warn(`failed fixing zones!!! ${oldCells.toString()} -> ${this.cells.toString()} != ${this.zones.length}x${this.zones ? this.zones[0].length : null}`)
    }
  }

  fixCols(cols) {
    if (cols < this.cells.x) this.removeColumns(cols)
    else this.addColums(cols)
    this.cells.x = cols
  }

  fixRows(rows) {
    if (rows < this.cells.y) this.removeRows(rows)
    else this.addRows(rows)
    this.cells.y = rows
  }

   // assumes oldCols > newCols
  removeColumns(newCols) {
    const deletedCols = this.zones.splice(newCols, this.cells.x - newCols)
    // move particles from dead zones
    for (let zone of deletedCols) {
      for (let particle of zone.particles) {
        const newCol = zone.x % this.cells.x
        this.zones[newCol][zone.y].particles.push(particle)
      }
      zone.particles = []
    }
  }

  // assumes oldRows > newRows
  removeRows(newRows) {
    for (let x=0;x<this.zones.length;x++) {
      const deletedRows = this.zones[x].splice(this.cells.y, newRows)
      // move particles from dead zones
      for (let zone of deletedRows) {
        for (let particle of zone.particles) {
          const newRow = zone.y % newRows
          this.zones[zone.x][newRow].particles.push(particle)
        }
        zone.particles = []
      }
    }
  }

  // assumes newCols > oldCols
  addColums(cols) {
    for (let x=this.cells.x;x<cols;x++) {
      this.zones.push([])
      for (let y=0;y<this.cells.y;y++) {
        const zone = new Zone(x, y, this.minDist)
        this.zones[x].push(zone)
      }
    }
  }

  // assumes newRows > oldRows
  addRows(rows) {
    for (let x=0;x<this.cells.x;x++) {
      for (let y=this.cells.y;y<rows;y++) {
        const zone = new Zone(x, y, this.minDist)
        this.zones[x].push(zone)
      }
    }
  }

  //
  // HELPERS

  eachZone(callback) {
    for (let col=0; col<this.cells.x; col++) {
      for (let row=0; row<this.cells.y; row++) {
        callback(this.zones[col][row])
      }
    }
  }

   getNearby(zone) {
    const nearby = []
    // setup columns, wrap sides
    for (let c=-1;c<2;c++) {
      let col = zone.x + c
      if      (col < 0)          col += this.cells.x
      else if (col >= this.cells.x) col -= this.cells.x
      // setup rows, within bounds
      for (let r=-1;r<2;r++) {
        let row = zone.y + r
        if      (row < 0)          row += this.cells.y
        else if (row >= this.cells.y) row -= this.cells.y
        // add zone
        nearby.push({
          zone: this.zones[col][row],
          offset: new Pos([c, r])
        })
      }
    }
    return nearby
  }

  /** @returns Array of {particle, zone, offset, distance} */
  getNearbyParticles(particle, zone) {
    const particles = []
    for (let {zone: nearZone, offset} of this.getNearby(zone)) {
      for (let other of nearZone.particles) {
        // ignore self
        if (other == particle) continue
        // out of range
        const nOffset = offset.copy().scale(this.minDist)
        const distance = particle.distance(other, nOffset)
        if (distance > this.minDist) continue
        // add particle
        particles.push({
          particle: other,
          zone: nearZone,
          offset: offset,
          distance: distance,
        })
      }
    }
    return particles
  }

  eachParticle(callback) {
    this.eachZone(zone => 
      zone.particles.forEach(particle => 
        callback(particle, zone)))
  }

  eachParticleNeighbors(callback) {
    this.eachParticle((particle, zone) => 
      callback(particle, this.getNearbyParticles(particle, zone)))
  }

  /** @callback_params (particle, neighbor, zone, offset, distance) */
  pairs(callback) {
    this.eachParticleNeighbors((particle, neighbors) => 
      neighbors.forEach(({ particle: neighbor, zone, offset, distance }) => 
        callback(particle, neighbor, zone, offset, distance)))
  }

  getZone(pos) {
    const [col, row] = pos.copy().map((val, _) => Math.floor(val * this.gridSize))
    return this.zones[col][row]
  }
}