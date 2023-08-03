export class Timer {

  static instances = {}

  constructor(historySize=1000) {
    this.startTime = null
    this.history = []
    this.sum = 0
    this.historySize = historySize
  }

  static instance(id, historySize=1000) {
    if (!Timer.instances[id]) { 
      Timer.instances[id] = new Timer(id, historySize)
    }
    return Timer.instances[id]
  }

  start() {
    this.startTime = this._now()
    return this
  }
  
  end() {
    const duration = (this._now() - this.startTime)
    if (this.history.length > this.historySize) { 
      this.sum -= this.history.shift()
    }
    this.history.push(duration)
    this.sum += duration
    this.avg = this.sum / this.history.length
    return this
  }

  _now() {
    return new Date().getTime()
  }

  render(ctx, x, y) {
    ctx.font = '20px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`${this.avg}ms`, x, y)
    return this
  }
}