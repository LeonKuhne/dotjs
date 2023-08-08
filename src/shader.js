import { API } from "./api.js"

export class Buffer {
  constructor(gl, program, name, dim, data=[]) {
    // NOTE I FUCKED THE ORDER UP HERE>>>> SORRY :/
    this.gl = gl
    // setup buffer
    this.buffer = gl.createBuffer()
    // link to shader
    this.dim = dim
    this.ref = gl.getAttribLocation(program, name)
    this.update(data)
    gl.vertexAttribPointer(this.ref, dim, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(ref) 
  }

  load() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
  }

  update(data) {
    this.load()
    this.gl.vertexAttribPointer(this.ref, this.dim, this.gl.FLOAT, false, 0, 0)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW)
  }
}

export class Shader {
  constructor(gl, vertexFilename, fragmentFilename) {
    this.gl = gl 
    this.program = gl.createProgram()
    this._loadSource(gl.VERTEX_SHADER, vertexFilename)
    this._loadSource(gl.FRAGMENT_SHADER, fragmentFilename)
    gl.linkProgram(this.program)
  }

  activate() {
    this.gl.useProgram(this.program)
  }

  _loadSource(type, url) {
    const gl = this.gl
    const source = API.fetch(`./assets/shaders/${url}`)
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    gl.attachShader(this.program, shader)
  }
}