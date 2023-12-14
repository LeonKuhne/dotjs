import { Zone } from './zone.js'
import { Pos } from './pos.js'

export class Grid {

  constructor(canvas, gridSize, distanceFunc) {
    this.gridSize = gridSize
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cells = new Pos([0, 0])
    this.zones = []
    this.distanceFunc = distanceFunc
    this.changingZones = new Set()
  }

  track(particle) {
    const zone = this.getZone(particle)
    particle.wrap(this.cells.copy().invert())
    zone.insert(particle)
    this.markForUpdate(zone)
  }

  resize(paneSize) {
    const newCells = paneSize.copy().map((val, _) => Math.ceil(val / this.gridSize))
    this.fixZones(newCells)
  }

  draw(offset) {
    this.changingZones.forEach(zone => {
      zone.clear(this.ctx, offset, this.gridSize)
      zone.draw(this.ctx, offset, this.gridSize)
    })
    this.changingZones = new Set()
  }

  tick(antigravity, airFriction, heatSpeed, speed) {
    // compute forces: onedirectional
    this.pairs(({ particle, other, otherOffset, distance }) => {
      const delta = particle.copy().subtract(otherOffset)
      if (distance == 0) return
      particle.applyGravity(other, delta, distance, antigravity)
      //particle.applyJitter()  // only apply jitter on interacting particles ???
    })
    // apply forces
    const moving = (particle) => !particle.velocity.every(x => x == 0)
    this.eachParticle((particle, zone) => {
      particle.force.scale(speed)
      particle.tick(airFriction, heatSpeed)
      if (moving(particle)) { 
        this.fixParticleZone(particle, zone) 
      }
    })
  }

  fixParticleZone(particle, zone) {
    const zoneOffset = particle.copy().floor()
    const newZonePos = zone.copy().slide(zoneOffset).wrap(this.cells)
    const newZone = this.zones[newZonePos.x][newZonePos.y]
    this.markForUpdate(zone)
    // check for zone change
    if (zone != newZone) {
      particle.wrapFactor(1)
      // remove from prev zone 
      const idx = zone.particles.indexOf(particle)
      zone.particles.splice(idx, 1)
      // add to new zone
      newZone.particles.push(particle)
      this.markForUpdate(newZone)
    }
  }

  markForUpdate(zone) {
    this.changingZones.add(zone)
  }

  // 
  // GRID RESIZING

  fixZones(newCells) {
    console.info("fixing zones")
    const oldCells = this.cells.copy()
    if (this.cells.x != newCells.x) this.fixCols(newCells.x)
    if (this.cells.y != newCells.y) this.fixRows(newCells.y) 
    // TODO remove this check once it works
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
        const updatedZone = this.zones[newCol][zone.y]
        updatedZone.particles.push(particle)
        this.markForUpdate(zone)
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
          const updatedZone = this.zones[zone.x][newRow]
          updatedZone.particles.push(particle)
          this.markForUpdate(zone)
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
        const zone = new Zone(x, y, this.gridSize)
        this.zones[x].push(zone)
        this.markForUpdate(zone)
      }
    }
  }

  // assumes newRows > oldRows
  addRows(rows) {
    for (let x=0;x<this.cells.x;x++) {
      for (let y=this.cells.y;y<rows;y++) {
        const zone = new Zone(x, y, this.gridSize)
        this.zones[x].push(zone)
        this.markForUpdate(zone)
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
    const wrapCell = (cell, max) => {
      if (cell < 0) return cell + max
      else if (cell >= max) return cell - max
      else return cell
    }
    for (let c=-1;c<2;c++) {
      let col = wrapCell(zone.x + c, this.cells.x)
      for (let r=-1;r<2;r++) {
        let row = wrapCell(zone.y + r, this.cells.y)
        nearby.push(this.zones[col][row])
      }
    }
    return nearby
  }

  eachParticle(callback) {
    this.eachZone(zone => 
      zone.particles.forEach(particle => 
        callback(particle, zone)))
  }

  getNearbyVectors(particle, zone) {
    const vectors = []
    for (let otherZone of this.getNearby(zone)) {
      const zoneDelta = otherZone.copy().subtract(zone)
      for (let other of otherZone.particles) {
        if (other == particle) continue // ignore self
        const otherOffset = other.copy().subtract(zoneDelta)
        const distance = this.distanceFunc(particle, otherOffset)
        if (distance > 1) continue // out of range
        vectors.push({ particle, other, otherOffset, distance })
      }
    }
    return vectors 
  }

  eachNearbyVector(callback) {
    this.eachParticle((particle, zone) => 
      callback(this.getNearbyVectors(particle, zone)))
  }

  pairs(callback) {
    this.eachNearbyVector(neighbors => neighbors.forEach(callback))
  }

  getZoneOffset(pos) {
    return pos.copy()
  }

  getZone(pos) {
    const [col, row] = pos.copy()
      .map((val, i) => Math.floor(val * this.cells[i]))
    return this.zones[col][row]
  }
}