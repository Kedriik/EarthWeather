  #version 300 es
  precision highp float;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec2 uScreenSize;
  layout (location = 0) out vec4 color;
  in vec3 WorldSpacePosition;
  void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x/= uScreenSize.x;
    uv.y/= uScreenSize.y;
    color = vec4(1.0);
    vec2 coord = gl_PointCoord - vec2(0.5);  //from [0,1] to [-0.5,0.5]
    float alfa = 1.0;
    float d = length(coord);
    if(d > 0.5)                  //outside of circle radius?
      discard;
    else 
      color.w*= (1.0-d); //d= 0.5 .. 0.0
    
  }