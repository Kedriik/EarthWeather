  #version 300 es
  precision highp float;
  layout (location = 0) out vec4 AtmosphereLayer;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  in vec4 WorldSpacePosition;
  in vec4 WorldSpaceNormal;
  void main(void){
      AtmosphereLayer       = vec4(WorldSpacePosition.xyz,1.0);
  }