
export class Grid {

  constructor(cols, rows, cellSize) {
    this.cols = cols
    this.rows = rows
    this.cellSize = cellSize
  }

  get width() { return this.cols * this.cellSize }
  get height() { return this.rows * this.cellSize }
}