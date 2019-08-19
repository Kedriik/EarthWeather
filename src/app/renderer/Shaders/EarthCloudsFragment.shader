 #version 300 es
  precision highp float; 
  uniform mat4 uModelMatrix;
  uniform float uPlanetSize;
  uniform mat4 uViewMatrix;
  uniform mat4 uInverseViewMatrix;
  uniform mat4 uInverseModelMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec3 uPlanetPosition;
  uniform vec2 uScreenSize;
  uniform sampler2D TopologyMap;
  uniform sampler2D ColorMap;
  layout (location = 0) out vec4 OutputColor;
  layout (location = 1) out vec4 OutputNormal;
  layout (location = 2) out vec4 OutputPosition;
  layout (location = 3) out vec4 OutputColorProperties;
  ///////////////NOISE UTILITY////////////
 float PI=3.14159265358;//97932384626433832;

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / (2.0*tan(radians(fieldOfView) / 2.0));
    return normalize(vec3(xy, -z));
}
  float sphere( in vec3 p){
    vec4 spherePos=vec4(0,0,0,1);
    spherePos=uViewMatrix*uModelMatrix*spherePos;
    return distance(p,spherePos.xyz) - 0.5;
  }
  float planetarySphere(in vec3 p,float R){
    vec4 spherePos=vec4(0,0,0,1);
    spherePos=uViewMatrix*uModelMatrix*spherePos;
    return distance(p,spherePos.xyz) - R;
  }
  vec4 color;
  vec3 materialProp;

  vec2 coordinates(vec3 dir){
    float u = ((atan(dir.x, dir.z) / PI) + 1.0f) * 0.5f;
    float v = (asin(dir.y) / PI) + 0.5f;
    return vec2(u,v);//(coords);

    
  }

  float remap(in float value, in float original_min, in float original_max, in float new_min, in float new_max){
  return new_min + ( ((value - original_min) / (original_max - original_min)) * (new_max - new_min) );
}
  vec2 _coords;
  float planetary(in vec3 p){
    vec4 spherePos=vec4(uPlanetPosition,1);
    spherePos=spherePos;
    p = (uInverseViewMatrix*vec4(p,1.0)).xyz;
    float A=0.028;
    float f=10.0;
    float R=uPlanetSize;
    float dist;
    vec3 dir=normalize(p-spherePos.xyz);
    dir=(uModelMatrix*vec4(dir,0)).xyz;
    vec4 seed=vec4(R*dir,1);
    _coords = coordinates(normalize(dir));
 
    dist = distance(p,spherePos.xyz) - (R);
    float h = distance(p,spherePos.xyz);

    return dist;
  }

  
  float sceneSDF(in vec3 p)
  {
    return planetary(p);
  }
  vec3 estimateNormal(vec3 p) {
    float EPSILON=0.001;
    return normalize(vec3(
    sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
    sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
    sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
  }
  vec3 estimateColor(vec3 p){

    return vec3(0,0,0);
  }
void main(void) {
  OutputColor = vec4(0,0,0,1);
  vec4 cameraPos=vec4(0,0,0,1);
  vec3 ray;
  ray = rayDirection(45.0, uScreenSize, gl_FragCoord.xy);
  ray = normalize(ray);
  float depth = 0.0;
  float epsilon=0.01;
  float dist = 99999.0;
  for(int i=0; i<32; i++){
    vec3 p = cameraPos.xyz + depth * ray;
     dist = sceneSDF(p);

    depth = depth + dist;
    if(abs(dist)<=epsilon){
      break;
    }          
  }
  vec3 p = cameraPos.xyz + depth * ray;
  if(abs(dist) <= epsilon){
    if(_coords.x>0.99 || _coords.x<0.01 || _coords.y>0.99 || _coords.y<0.01){
      color = textureGrad(ColorMap, _coords,vec2(0.0001),vec2(0.0001));
    }
    else{
      color = texture(ColorMap, _coords);
    }
    vec3 normal = estimateNormal(p);
    normal = (uInverseViewMatrix*vec4(normal,0.0)).xyz;
    p = (uInverseViewMatrix*vec4(p,1.0)).xyz;
    OutputNormal.xyz = normal;
    OutputNormal.w = 1.0;
    OutputPosition.xyz = p;
    OutputPosition.w = 1.0;
    OutputColor.xyz = vec3(1.0);
    OutputColor.w = 1.0;
    OutputColorProperties.xyz = vec3(0,color.x,0);
 
    OutputColorProperties.w = 1.0;
    ///
     vec4 Pclip = uProjectionMatrix*uViewMatrix * vec4 (p, 1);
    
    float ndc_depth = Pclip.z / Pclip.w;
      
       
    float C =1.0,
    near = 0.1,
    far = 100000.0;
    float depth;
    depth=(2.0*log2(max(1.0/1000000.0,C*Pclip.w + 1.0)) / log2(max(1.0/1000000.0,C*far + 1.0) )- 1.0);

    gl_FragDepth = (
        (gl_DepthRange.diff * depth) +
        gl_DepthRange.near + gl_DepthRange.far) / 2.0;
    return;
  }
discard;
}