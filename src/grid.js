import { Zone } from './zone.js'
import { Pos } from './pos.js'
import { Timer } from './timer.js'

export class Grid {

  constructor(canvas, gridSize, distanceFunc) {
    this.gridSize = gridSize
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cells = new Pos([0, 0])
    this.zones = []
    this.distanceFunc = distanceFunc
    this.changingZones = new Set()
    this.lazyNearbyZone = {}
  }

  track(particle) {
    const zone = this.getZone(particle)
    particle
      .multiply(this.cells.copy())
      .mod1()
    zone.insert(particle)
    this.markForUpdate(zone)
  }

  resize(paneSize) {
    const newCells = paneSize.copy().map((val, _) => Math.ceil(val / this.gridSize))
    this.fixZones(newCells)
  }

  draw(offset) {
    const timer = Timer.instance('grid.draw').start()
    // collect neighboring zones
    const neighboringZones = new Set()
    this.changingZones.forEach(zone => {
      zone.clear(this.ctx, offset, this.gridSize)
      this.getNearby(zone).forEach(neighbor => {
        if (this.changingZones.has(neighbor)) return
        neighboringZones.add(neighbor)
      })
    })
    // in order from left to right, top to bottom
    const orderedZones = Array.from(this.changingZones) 
      .sort((a, b) => a.x - b.x || a.y - b.y)  
    // udpate zones that changed
    orderedZones.forEach(zone => {
      zone.draw(this.ctx, offset, this.gridSize)
    })
    // clear neighboring zones
    this.changingZones = new Set()
    timer.end()
  }

  tick(antigravity, airFriction, heatSpeed, speed) {
    let timer = Timer.instance('grid.tick compute').start()
    // compute forces: onedirectional
    this.pairs(({ particle, other, otherOffset, distance }) => {
      const delta = particle.copy().subtract(otherOffset)
      if (distance == 0) return
      particle.applyGravity(other, delta, distance, antigravity)
      //particle.applyJitter()  // only apply jitter on interacting particles ???
    })
    timer.end()
    timer = Timer.instance('grid.tick apply').start()
    // apply forces
    const moving = (particle) => !particle.velocity.every(x => x == 0)
    this.eachParticle((particle, zone) => {
      particle.force.scale(speed)
      particle.tick(airFriction, heatSpeed)
      if (moving(particle)) { 
        this.fixParticleZone(particle, zone) 
      }
    })
    timer.end()
  }

  fixParticleZone(particle, zone) {
    const zoneOffset = particle.copy().floor()
    const newZonePos = zone.copy().slide(zoneOffset).wrap(this.cells)
    const newZone = this.zones[newZonePos.x][newZonePos.y]
    this.markForUpdate(zone)
    // check for zone change
    if (zone != newZone) {
      particle.mod1()
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
    if (zone.x in this.lazyNearbyZone && zone.y in this.lazyNearbyZone[zone.x]) {
      return this.lazyNearbyZone[zone.x][zone.y]
    }
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
    if (!(zone.x in this.lazyNearbyZone)) this.lazyNearbyZone[zone.x] = {}
    this.lazyNearbyZone[zone.x][zone.y] = nearby
    return nearby
  }

  eachParticle(callback) {
    this.eachZone(zone => 
      zone.particles.forEach(particle => 
        callback(particle, zone)))
  }

  filterPair(particle, other, zone, otherZone) {
    // TODO lazy load this
    const timer = Timer.instance('grid.filterPair').start()
    if (other == particle) return // ignore self
    const zoneDelta = otherZone.copy().subtract(zone)
    const otherOffset = other.copy().subtract(zoneDelta)
    const distance = this.distanceFunc(particle, otherOffset)
    if (distance > 1) return // out of range
    timer.end()
    return { particle, other, otherOffset, distance }
  }

  getNearbyVectors(particle, zone) {
    // figure out how to lazy load this or speed it up some other way
    const timer = Timer.instance('grid.getNearbyVectors').start()
    const vectors = []
    for (let otherZone of this.getNearby(zone)) {
      for (let other of otherZone.particles) {
        const pair = this.filterPair(particle, other, zone, otherZone)
        if (!pair) continue
        vectors.push(pair)
      }
    }
    timer.end()
    return vectors 
  }

  eachNearbyVector(callback) {
    this.eachParticle((particle, zone) => 
      callback(this.getNearbyVectors(particle, zone)))
  }

  pairs(callback) {
    const timer = Timer.instance('grid.pairs').start()
    this.eachNearbyVector(neighbors => neighbors.forEach(callback))
    timer.end()
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