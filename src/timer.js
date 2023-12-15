export class Timer {

  static instances = {}

  constructor(historySize=1000) {
    this.createTime = Timer._now()
    this.startTime = null
    this.history = []
    this.sum = 0
    this.historySize = historySize
    this.count = 0
  }

  static instance(id, historySize=1000) {
    if (!Timer.instances[id]) { 
      Timer.instances[id] = new Timer(id, historySize)
    }
    return Timer.instances[id]
  }

  start() {
    this.startTime = Timer._now()
    return this
  }
  
  end() {
    this.count += 1
    const duration = (Timer._now() - this.startTime)
    if (this.history.length > this.historySize) { 
      this.sum -= this.history.shift()
    }
    this.history.push(duration)
    this.sum += duration
    this.avg = this.sum / this.history.length
    return this
  }

  static _now() {
    return new Date().getTime()
  }

  static render(ctx, x, y) {
    ctx.font = '12px Arial'
    const clearLn = (str) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
      ctx.fillRect(x, y - 12, 200, 12)
    }
    const printLn = (str, offset=0) => {
      ctx.fillStyle = 'white'
      ctx.fillText(str, x + offset, y)
    }

    clearLn()
    printLn('impact/s')
    printLn('Method', 80)

    for (const [id, timer] of Object.entries(Timer.instances)) {
      y += 12
      clearLn()
      const createDuration = (Timer._now() - timer.createTime) / 1000 // in seconds
      //const impact = timer.avg * timer.count
      const impactPerSecond = timer.sum / createDuration
      printLn(parseInt(impactPerSecond * 100) / 100)
      //printLn(parseInt(timer.avg * timer.count))
      printLn(id, 80)
    }
    return this
  }
}