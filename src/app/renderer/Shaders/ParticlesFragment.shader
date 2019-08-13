  #version 300 es
  precision highp float;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  // layout (location = 0) out vec4 OutputColor;
  // layout (location = 1) out vec4 OutputNormal;
  // layout (location = 2) out vec4 OutputPosition;
  // layout (location = 3) out vec4 OutputColorProperties;
  out vec4 color;
  in vec3 WorldSpacePosition;
  void main(void){
    // vec4 Pclip = uProjectionMatrix*uViewMatrix * vec4(WorldSpacePosition, 1.0);
    // float C =1.0,
    // near = 0.1,
    // far = 100000.0;
    // float depth;
    // depth=(2.0*log2(max(1.0/1000000.0,C*Pclip.w + 1.0)) / log2(max(1.0/1000000.0,C*far + 1.0) )- 1.0);
    // gl_FragDepth = (
    //     (gl_DepthRange.diff * depth) +
    //     gl_DepthRange.near + gl_DepthRange.far) / 2.0;

gl_FragDepth = 0.0;
    color = vec4(0.0,1.0,0.0,1.0);
  }