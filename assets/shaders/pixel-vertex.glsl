// optimize by changing coordinate system to use center of 0,0 to remove x*2-1 transformation
attribute vec2 position;
void main() {
  gl_PointSize = 8.0;
  // change position range from range 0,1 to -1,1
  vec2 new_position = position * 2.0 - vec2(1.0);
  // invert y axis
  new_position.y *= -1.0;
  gl_Position = vec4(new_position, 0.0, 1.0);
}