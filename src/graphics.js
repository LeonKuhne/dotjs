import { Shader, Buffer } from "./shader.js"

export class Graphics {
  constructor(canvas, screenSize, fillRatio=1) {
    // setup webgl
    const gl = canvas.getContext('webgl')
    if (!gl) throw Error('WebGL not supported')
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

    // create a texture to render to
    this.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // create a framebuffer to render to
    this.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)

    this.gl = gl
    this.resize(screenSize)
    // setup pixel shader
    this.pixelShader = new Shader(gl, 'pixel-vertex.glsl', 'pixel-fragment.glsl')
    this.var_position = new Buffer(gl, this.pixelShader.program, 'position', 2)
    // setup texture shader
    this.textureShader = new Shader(gl, 'texture-vertex.glsl', 'texture-fragment.glsl')
    this.var_a_position = new Buffer(gl, this.textureShader.program, 'a_position', 2, [[-1,-1], [1,-1], [-1,1], [1,1]])
    this.var_a_uv = new Buffer(gl, this.textureShader.program, 'a_uv', 2, [[0,0], [0,1], [1,0], [1,1]])

    this.fillRatio = fillRatio
  }

  clear() {
    // clear screen
    const gl = this.gl
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    // clear points
    this.points = []
  }

  color(color) {
    // set the gl color
    // TODO
    //this._addParam(color)
  }

  stamp() {
    // draw points to texture
    this._drawPointsToTexture(this.points, this.texture)
    // draw texture to screen
    this._drawMirrors()
  }

  resize(size) {
    // TODO use or remove size
    const gl = this.gl
    // old texture only fills top right corner
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.x, size.y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    // new texture fills whole screen
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  }

  drawPoint(pos) {
    this.points.push(pos.pos)
  }

  _drawPointsToTexture(points, texture) {
    const gl = this.gl
    this.pixelShader.activate()
    this.var_position.update(points)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    // compute shaders
    gl.drawArrays(gl.POINTS, 0, points.length)
    // apply texture 
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  _drawMirrors() {
    const gl = this.gl
    this.textureShader.activate()
    // attribute bindings
    this.var_a_position.load()
    this.var_a_uv.load()
    // setup texture
    const textureLocation = gl.getUniformLocation(this.textureShader.program, "u_texture")
    gl.uniform1i(textureLocation, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    // u_offset bindings
    const offsetLocation = gl.getUniformLocation(this.textureShader.program, "u_offset")
    gl.uniform2f(offsetLocation, 0, 0)
    // draw
    //gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.points.length)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}