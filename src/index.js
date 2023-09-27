import { Engine } from './engine.js'
import { CodeNode } from './codeNode.js'
import { Particle } from './particle.js'
import { Pos } from './pos.js'

window.onload = () => {
  // setup canvas
  const canvas = document.getElementById('canvas')
  canvas.width = document.body.clientWidth
  canvas.height = document.body.clientHeight

  // setup engine
  const engine = new Engine(canvas)
  window.dot = engine
  let paintSpin = () => [Math.random(),Math.random(), Math.random()]

  // add particles
  let mouseDown = false
  let lastClick = new Pos([0, 0])
  let minDelta = 5
  const addParticles = (clickX, clickY) => {
    const click = new Pos([clickX, clickY])
    if (!mouseDown 
      || Math.abs(click.x - lastClick.x) < minDelta 
      || Math.abs(click.y - lastClick.y) < minDelta
    ) return
    lastClick = click.copy()
    // account for the screen offset
    click
      .subtract(engine.paneOffset)
      .divide(engine.paneSize)
      .slideFactor(1)
      .mod(1)
    engine.add(paintSpin(), click)
  }
  // listeners
  document.addEventListener('mousedown', e => {
    if (e.target !== canvas) return
    mouseDown = true
    addParticles(e.clientX, e.clientY)
  })
  document.addEventListener('mouseup', e => mouseDown = false)
  document.addEventListener('mousemove', e => 
    addParticles(e.clientX, e.clientY))
  // mobile listeners
  document.addEventListener('touchstart', e => mouseDown = true)
  document.addEventListener('touchend', e => mouseDown = false)
  document.addEventListener('touchmove', e => 
    addParticles(e.touches[0].clientX, e.touches[0].clientY))

  // controls
  document.addEventListener('keydown', e => {
    // press space to pause
    if (e.code === 'Space') engine.toggle()
    // press r to reset
    if (e.key === 'r') engine.reset()
  })

  // create color options elements
  const colorPalette = document.querySelector('.color-palette')
  const [numColors, numBrightness] = [20, 20]
  for (let i = 0; i < numColors; i++) { // hue
    for (let b = 0; b < numBrightness; b++) { // brightness
      const color = document.createElement('div')
      color.classList.add('color')
      color.style.background = `hsl(${i * 360/numColors}, 100%, ${b * 100/numBrightness}%)`
      const setColor = (e) => {
        // parse background style to rgb array
        const rgb = e.target.style.background
          .replace('rgb(', '')
          .replace(')', '')
          .split(',')
          .map(c => parseInt(c) / 255)
        paintSpin = () => rgb
      }
      color.addEventListener('mousedown', setColor)
      color.addEventListener('click', setColor)
      colorPalette.appendChild(color)
    }
  }

  // update speed
  const speedSlider = document.querySelector('.setSpeed')
  if (speedSlider) {
    speedSlider.addEventListener('input', e => {
      engine.speed = e.target.value ** 2
    })
    speedSlider.dispatchEvent(new Event('input'))
  }

  // update spread
  const spreadSlider = document.querySelector('.setSpread')
  if (spreadSlider) {
    spreadSlider.addEventListener('input', e => {
      engine.antigravity = e.target.value
    })
    spreadSlider.dispatchEvent(new Event('input'))
  }

  // update min interaction distance
  const minInteractionDistanceSlider = document.querySelector('.setMinInteractDistance')
  if (minInteractionDistanceSlider) {
    minInteractionDistanceSlider.addEventListener('input', e => {
      engine.minInteractDistance = e.target.value
    })
    minInteractionDistanceSlider.dispatchEvent(new Event('input'))
  }

  // toggle sidebar menu
  const menu = document.querySelector('.menu')
  const head = document.querySelector('.head')
  const menuToggle = document.querySelector('.toggleMenu')
  head.addEventListener('click', e => {
    menu.classList.toggle('hidden')
    menuToggle.classList.toggle('active')
  })

  // set distance function
  new CodeNode(
    engine,
    document.querySelector('.distanceCode'),
    document.querySelector('.distanceCodeError'),
    document.querySelector('.distanceCodePreset'),
    {
      "euclidean": engine.distanceFunc.toString()
        .replace(/.*\{/, '') // remove everything before the first {
        .replace(/\}.*$/, '') // remove everything after the last }
        .split('\n').map(l => l.replace(/^      /, '')).join('\n') // remove first four spaces of each line
        .split('\n').filter(l => l.trim() !== '').join('\n'), // remove empty lines (including ones with just spaces)
      "manhatten": `\
        return Math.abs(a.x - b.x)
          + Math.abs(a.y - b.y)`,
      "biquadratic": `\
        return Math.pow(a.x - b.x, 2)
          + Math.pow(a.y - b.y, 2)`,
      "minkowski": `\
        return Math.pow(
          Math.pow(Math.abs(a.x - b.x), 3)
            + Math.pow(Math.abs(a.y - b.y), 3),
          1/3
        )`,
      "chebyshev": `\
        return Math.max(
          Math.abs(a.x - b.x),
          Math.abs(a.y - b.y)
        )`,
      "wave": `\
        return Math.abs(
          Math.sin(a.x - b.x)
            + Math.sin(a.y - b.y)
        )`,
  }, callback => engine.distanceFunc = callback)

  // set spin function
  new CodeNode(
    engine,
    document.querySelector('.spinCode'),
    document.querySelector('.spinCodeError'),
    document.querySelector('.spinCodePreset'),
    {
      "avg abs error": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const spinA = a.spin[i]
          const spinB = b.spin[i]
          sum += Math.abs(spinA - spinB) / 2
        }
        return (sum / a.spin.length) ** 0.5`,
      "euclidean repel": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const j = (i + 1) % a.spin.length 
          sum += (a.spin[i] - b.spin[j]) ** 2
        }
        return sum ** 0.5`,
      "euclidean chase": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const j = (i + 1) % a.spin.length 
          sum += (a.spin[i] + b.spin[j]) ** 2
        }
        return sum ** 0.5`,
      "repel": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const j = (i + 1) % a.spin.length 
          sum += a.spin[i] - b.spin[j]
        }
        return sum / a.spin.length`,
      "average": Particle.SpinDelta.toString()
        .replace(/.*\{/, '') // remove everything before the first {
        .replace(/\}.*$/, '') // remove everything after the last }
        .split('\n').map(l => l.replace(/^      /, '')).join('\n') // remove first four spaces of each line
        .split('\n').filter(l => l.trim() !== '').join('\n'), // remove empty lines (including ones with just spaces)
      "chase": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const j = (i + 1) % a.spin.length 
          sum += a.spin[i] + b.spin[j]
        }
        return sum / a.spin.length`,
      "abs square": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const spinA = a.spin[i]
          const spinB = b.spin[i]
          sum += spinA > spinB ? (spinA-spinB) ** 2 : (spinB-spinA) ** 2
        }
        return sum / a.spin.length`,
      "avg squared": `\
        let sum = 0
        for (let i = 0; i < a.spin.length; i++) {
          const spinA = a.spin[i]
          const spinB = b.spin[i]
          sum += ((spinA - spinB) / 2) ** 2
        }
        return (sum / a.spin.length) ** 0.5`,
    }, callback => Particle.SpinDelta = callback)

  // start
  engine.run()
}