import { Zone } from './zone.js'
import { Pos } from './pos.js'
import { Particle } from './particle.js'

export class Grid {

  constructor(canvas, gridSize) {
    this.gridSize = gridSize
    this.zones = []
    this.particles = {}
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.canvas.addEventListener('resize', this.resize)
    this.resize()
  }

  add(particle) {
    throw new Error("fix this function by combining code")

    // original add method
    this.particles[particle.id] = particle
    this.applyDeltas(particle)

    // zone add method
    const zone = this.getZone(pos)
    const offset = this.getOffset(pos)
    const particle = new Particle(offset, features)
    this.applyDeltas
    zone.add(particle)
  }

  find(id) {
    return this.particles[id]
  }

  resize() {
    this.cols = Math.ceil(this.canvas.width / this.gridSize)
    this.rows = Math.ceil(this.canvas.height / this.gridSize)
    this.height = this.rows * this.gridSize 
    this.width = this.cols * this.gridSize
    this.canvas.width = this.width
    this.canvas.height = this.height
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = "#000000"
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.eachZone(zone => zone.draw(this.ctx))
  }

  deltas(callback) {
    // compute deltas 
    this.pairs((particle, neighbor, zone, offset, distance) => {
      callback(particle, neighbor, zone, offset, distance)
    })
    // apply deltas
    this.eachParticle((particle, zone) => {
      particle.apply(this.airFriction, this.heatSpeed)
      this.applyDeltas(particle, zone)
    })
  }

  applyDeltas(particle, zone=null) {
    const col = this.wrapColumn(zone.col, particle)
    const row = this.stopRow(zone.row, particle)
    // update zone
    if (col != zone.col || row != zone.row) {
      // remove from prev zone 
      const idx = zone.particles.indexOf(particle)
      zone.particles.splice(idx, 1)
      // add to new zone
      this.zones[col][row].add(particle)
    }
  }

  // 
  // GRID RESIZING

  fixZones(newCols, newRows) {
    if (this.cols != newCols) this.fixCols(newCols)
    if (this.rows != newRows) this.fixRows(newRows) 
    const oldCols = this.cols
    const oldRows = this.rows 
    this.eachZone(zone => zone.fix(this.gridSize))
    if (this.cols != this.zones.length || this.zones && this.rows != this.zones[0].length) {
      console.warn(`failed fixing zones!!! ${oldCols}x${oldRows} -> ${this.cols}x${this.rows} != ${this.zones.length}x${this.zones ? this.zones[0].length : null}`)
    }
  }

  fixCols(cols) {
    if (cols < this.cols) this.removeColumns(cols)
    else this.addColums(cols)
    this.cols = cols
  }

  fixRows(rows) {
    if (rows < this.rows) this.removeRows(rows)
    else this.addRows(rows)
    this.rows = rows
  }

   // assumes oldCols > newCols
  removeColumns(newCols) {
    const deletedCols = this.zones.splice(newCols, this.cols - newCols)
    // move particles from dead zones
    for (let zone of deletedCols) {
      for (let particle of zone.particles) {
        const newCol = zone.col % this.cols 
        this.zones[newCol][zone.row].particles.push(particle)
      }
      zone.particles = []
    }
  }

  // assumes oldRows > newRows
  removeRows(newRows) {
    for (let x=0;x<this.zones.length;x++) {
      const deletedRows = this.zones[x].splice(this.rows, newRows)
      // move particles from dead zones
      for (let zone of deletedRows) {
        for (let particle of zone.particles) {
          const newRow = zone.row % newRows
          this.zones[zone.col][newRow].particles.push(particle)
        }
        zone.particles = []
      }
    }
  }

  // assumes newCols > oldCols
  addColums(cols) {
    for (let x=this.cols;x<cols;x++) {
      this.zones.push([])
      for (let y=0;y<this.rows;y++) {
        const zone = new Zone(x, y, this.minDist)
        this.zones[x].push(zone)
      }
    }
  }

  // assumes newRows > oldRows
  addRows(rows) {
    for (let x=0;x<this.cols;x++) {
      for (let y=this.rows;y<rows;y++) {
        const zone = new Zone(x, y, this.minDist)
        this.zones[x].push(zone)
      }
    }
  }

  //
  // HELPERS

  eachZone(callback) {
    for (let column of this.zones) {
      for (let z=0;z<column.length;z++) {
        callback(column[z])
      }
    }
  }

   getNearby(zone) {
    const nearby = []
    // setup columns, wrap sides
    for (let c=-1;c<2;c++) {
      let col = zone.col + c
      if      (col < 0)          col += this.cols 
      else if (col >= this.cols) col -= this.cols
      // setup rows, within bounds
      for (let r=-1;r<2;r++) {
        const row = zone.row + r
        if (row < 0 || row >= this.rows) continue
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
        const nOffset = offset.copy()
        nOffset.scale(this.minDist)
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
}