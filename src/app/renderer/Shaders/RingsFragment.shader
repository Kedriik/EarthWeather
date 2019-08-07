  #version 300 es
  precision highp float;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec3 uPlanetPosition;
  uniform sampler2D uColor;

  layout (location = 0) out vec4 OutputColor;
  layout (location = 1) out vec4 OutputNormal;
  layout (location = 2) out vec4 OutputPosition;
  layout (location = 3) out vec4 OutputColorProperties;

  in vec4 WorldSpacePosition;
  in vec4 WorldSpaceNormal;
  vec3 color = vec3(0.0,0.0,0.0);
  void main(void){
    vec3 normal = WorldSpaceNormal.xyz;
    OutputNormal.xyz = normal;
    OutputNormal.w = 1.0;
    OutputPosition.xyz = WorldSpacePosition.xyz;
    OutputPosition.w = 1.0;
    /*
    58.2 Saturn radius
    0..1
    l = 
    65.2 -> first ring
    138.2 -> last
    */
    float fr = 65.2;
    float lr = 138.2;
    float l = 138.2 - 65.2;
    float d = distance(uPlanetPosition,WorldSpacePosition.xyz) - fr;
    float x = d/l;
    float a = 0.0;
    float z = 0.0;
    float f = 0.2;
    if(x > 0.0 && x < 1.0){
      color = texture(uColor, vec2(x,0.0)).xyz;
      if(color.x > f || color.y > f || color.z > f){
        a = 1.0;
        z = 1.0;
      }
    }
    if(a == 0.0){
      discard;
    }
    OutputColor.xyz = color;
    OutputColor.w = 1.0;
    OutputColorProperties.xyz = vec3(0,a,z);
    OutputColorProperties.w = 1.0;
    
    vec4 Pclip = uProjectionMatrix*uViewMatrix * vec4 (WorldSpacePosition.xyz, 1);
    
    float C =1.0,
    near = 0.1,
    far = 100000.0;
    float depth;
    depth=(2.0*log2(max(1.0/1000000.0,C*Pclip.w + 1.0)) / log2(max(1.0/1000000.0,C*far + 1.0) )- 1.0);

    gl_FragDepth = (
        (gl_DepthRange.diff * depth) +
        gl_DepthRange.near + gl_DepthRange.far) / 2.0;
  }