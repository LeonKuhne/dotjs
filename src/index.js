import { Engine } from './engine.js'

window.onload = () => {
  // setup canvas
  const canvas = document.getElementById('canvas')
  canvas.width = document.body.clientWidth / 3
  canvas.height= document.body.clientHeight / 3

  // surround the canvas with mirror views
  const view = document.createElement('div')
  view.classList.add('views')
  document.body.appendChild(view)
  // arrange views
  canvas.remove()
  for (let i = 0; i < 9; i++) {
    const mirror = document.createElement('div')
    view.appendChild(mirror)
    if (i === 4) {
      mirror.classList.add('mainView')
      mirror.appendChild(canvas)
      continue
    }
    mirror.classList.add('dummyView')
    mirror.appendChild(canvas.cloneNode())
  }

  // create update mirror function
  const mirrorFps = 60
  const mirrorTo = (mirror) => {
    const sourceCtx = canvas.getContext('2d')
    const targetCtx = mirror.getContext('2d')
    const [width, height] = [mirror.width, mirror.height]
    targetCtx.clearRect(0, 0, width, height)
    targetCtx.drawImage(canvas, 0, 0, width, height)
  }

  // every x seconds, update mirrors
  setInterval(() => {
    const views = document.querySelectorAll('.dummyView')
    views.forEach(view => mirrorTo(view.children[0]))
  }, 1000 / mirrorFps)
    
  // setup engine
  const engine = new Engine(canvas)
  window.dot = engine
  let paintSpin = () => [Math.random(),Math.random(), Math.random()]

  // add particles
  let mouseDown = false
  let [lastX, lastY] = [0, 0]
  let minDelta = 5
  const addParticles = (clickX, clickY) => {
    if (!mouseDown 
      || Math.abs(clickX - lastX) < minDelta 
      || Math.abs(clickY - lastY) < minDelta
    ) return
    [lastX, lastY] = [clickX, clickY]
    const rect = canvas.getBoundingClientRect()
    const x = (clickX - rect.left) / canvas.width
    const y = (clickY - rect.top) / canvas.height 
    engine.add(paintSpin(), [x, y])
  }
  // listeners
  document.addEventListener('mousedown', e => mouseDown = true)
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
        e.preventDefault()
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
    speedSlider.addEventListener('input', 
      e => engine.speed = e.target.value ** 2)
    speedSlider.dispatchEvent(new Event('input'))
  }

  // update spread
  const spreadSlider = document.querySelector('.setSpread')
  if (spreadSlider) {
    spreadSlider.addEventListener('input', 
      e => engine.antigravity = e.target.value)
    spreadSlider.dispatchEvent(new Event('input'))
  }

  // update min interaction distance
  const minInteractionDistanceSlider = document.querySelector('.setMinInteractDistance')
  if (minInteractionDistanceSlider) {
    minInteractionDistanceSlider.addEventListener('input', 
      e => engine.minInteractDistance = e.target.value)
    minInteractionDistanceSlider.dispatchEvent(new Event('input'))
  }

  // toggle sidebar menu
  const menu = document.querySelector('.menu')
  const menuToggle = document.querySelector('.toggleMenu')
  menuToggle.addEventListener('click', e => {
    menu.classList.toggle('hidden')
    menuToggle.classList.toggle('active')
  })

  // set distance function
  const distanceCode = document.querySelector('.distanceCode')
  const distanceCodeError = document.querySelector('.distanceCodeError')
  const distanceCodePresets = {
    "manhatten": `\
      return Math.abs(a.x - b.x)
        + Math.abs(a.y - b.y)`,
    "euclidean": engine.distanceFunc.toString()
      .replace(/.*\{/, '') // remove everything before the first {
      .replace(/\}.*$/, '') // remove everything after the last }
      .split('\n').map(l => l.replace(/^    /, '')).join('\n') // remove first four spaces of each line
      .split('\n').filter(l => l.trim() !== '').join('\n'), // remove empty lines (including ones with just spaces)
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
  }
  const selectedPreset = document.querySelector('.distanceCodePreset')
  // add presets
  for (let preset in distanceCodePresets) {
    const option = document.createElement('option')
    option.value = preset
    option.innerText = preset
    selectedPreset.appendChild(option)
  }
  // update code on preset
  selectedPreset.addEventListener('change', e => {
    // make code presentable
    let code = distanceCodePresets[e.target.value]
    const indent = code.match(/^ */)[0]
    code = code.split('\n').map(l => l.replace(indent, '')).join('\n')
    distanceCode.value = code
    distanceCode.dispatchEvent(new Event('input'))
  })
  selectedPreset.dispatchEvent(new Event('change'))
  distanceCode.value = localStorage.getItem('distanceCode') || distanceCodePresets[selectedPreset.value] 
    //"chebyshev": `\

  if (distanceCode) {
    distanceCode.addEventListener('input', e => {
      // update code
      try {
        engine.distanceFunc = new Function('a', 'b', e.target.value)
        distanceCode.style.borderColor = 'green'
        distanceCodeError.innerText = ''
      } catch (err) {
        distanceCode.style.borderColor = 'red'
        distanceCodeError.innerText = err.message
      }
      // cache code
      localStorage.setItem('distanceCode', e.target.value)
      // update height
      const numLines = e.target.value.split('\n').length
      e.target.style.height = `${numLines}rem`
    })
    distanceCode.dispatchEvent(new Event('input'))
  }

  // start
  engine.run()
}