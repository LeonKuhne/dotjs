export class CodeNode {

  constructor(engine, codeElem, errorElem, selectedElem, presets, updateCode) {
    // set distance function
    this.codeElem = codeElem
    this.errorElem = errorElem
    this.selectedElem = selectedElem
    this.presets = presets
    this.engine = engine
    this.onUpdateCode = updateCode

    // add presets
    for (let preset in this.presets) {
      const option = document.createElement('option')
      option.value = preset
      option.innerText = preset
      this.selectedElem.appendChild(option)
    }

    // update code on preset
    this.selectedElem.addEventListener('change', e => {
      // make code presentable
      let code = this.presets[e.target.value]
      const indent = code.match(/^ */)[0]
      code = code.split('\n').map(l => l.replace(indent, '')).join('\n')
      this.codeElem.value = code
      this.codeElem.dispatchEvent(new Event('input'))
    })
    this.selectedElem.dispatchEvent(new Event('change'))
    this.codeElem.value = this.presets[this.selectedElem.value] 
    if (this.codeElem) {
      this.codeElem.addEventListener('input', e => {
        const code = e.target.value
        // update code
        try {
          this.onUpdateCode(new Function('a', 'b', code))
          this.codeElem.parentElement.style.borderColor = 'green'
          this.errorElem.innerText = ''
        } catch (err) {
          this.codeElem.parentElement.style.borderColor = 'red'
          this.errorElem.innerText = err.message
        }
        // update height
        const numLines = code.split('\n').length
        e.target.style.height = `${numLines}rem`
      })
      this.codeElem.dispatchEvent(new Event('input'))
    }
  }
}