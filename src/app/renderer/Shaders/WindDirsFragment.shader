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
  ///////////////NOISE UTILITY////////////
 float PI=3.14159265358;//97932384626433832;

float rand(const vec2 co) {
    float t = dot(vec2(12.9898, 78.233), co);
    return fract(sin(t) * (4375.85453 + t));
}

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
     return vec2(1.0-(((atan(dir.x, dir.y) / PI) + 1.0f) * 0.5f),(asin(-dir.z) / PI) + 0.5f);
  }

  float remap(in float value, in float original_min, in float original_max, in float new_min, in float new_max){
  return new_min + ( ((value - original_min) / (original_max - original_min)) * (new_max - new_min) );
}
  vec2 _coords;
  vec4 spherePos;
  float dist;
  vec3 dir;
  float planetary(in vec3 p){
    p = (uInverseViewMatrix*vec4(p,1.0)).xyz;
    dir=normalize(p);
    dir=(uModelMatrix*vec4(dir,0)).xyz;
    _coords = coordinates(normalize(dir));
    dist = distance(p,spherePos.xyz) - (uPlanetSize);
    return dist;
  }

  
  float sceneSDF(in vec3 p)
  {
    return planetary(p);
  }
  float EPSILON=0.001;
  vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
    sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
    sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
    sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
  }
  vec3 estimateColor(vec3 p){

    return vec3(0,0,0);
  }
  vec3 earthPos(vec2 uv){
  float lWidth = 1.0;
  float lHeight = 1.0;
  float radius = 1.0;
  float theta = ((2.0 * PI) / lWidth) * uv.x;
  float phi = (PI / lHeight) *uv.y;
  float dX = cos(theta) * sin(phi) * radius;
  float dY = sin(theta) * sin(phi) * radius;
  float dZ = -cos(phi) * radius;
  return vec3(-dX, dY, dZ);
}
// float fi = asin(p.z/uPlanetSize);
//   float l  = atan(p.y,p.x)
//vec3 N = (vec3(-sin(fi)*cos(l), -sin(fi)*sin(l),cos(fi)));
vec3 windDir(vec3 p){
  float fi = asin(p.z);
  float l  = atan(p.y,p.x);
  vec3 E = vec3(-sin(l), cos(l), 0.0);
  vec3 N = (vec3(-sin(fi)*cos(l), -sin(fi)*sin(l),cos(fi)));
  return E;
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
  vec3 p;
  for(int i=0; i<32; i++){
    p = cameraPos.xyz + depth * ray;
    dist = sceneSDF(p);

    depth = depth + dist;
    if(abs(dist)<=epsilon){
      break;
    }          
  }
  p = cameraPos.xyz + depth * ray;
  if(abs(dist) <= epsilon){
    if(_coords.x>0.99 || _coords.x<0.01 || _coords.y>0.99 || _coords.y<0.01){
      color = textureGrad(ColorMap, _coords,vec2(0.0001),vec2(0.0001));
    }
    else{
      color = texture(ColorMap, _coords);
    }
    p = normalize((inverse(uViewMatrix)*vec4(p,1.0)).xyz);
    vec4 positionModelSpace = vec4(dir,1.0);//vec4(earthPos(_coords),1.0);
    vec4 windDirModelSpace  = vec4(windDir((inverse(uModelMatrix)*vec4(p,1.0)).xyz),0.0);
    vec4 finalDirVector = (uProjectionMatrix*uViewMatrix*uModelMatrix*windDirModelSpace); 
    //finalDirVector.xyz /= finalDirVector.w;
    OutputColor.xyz = 0.01*finalDirVector.xyz;
    OutputColor.w = 1.0;

    p = (uInverseViewMatrix*vec4(p,1.0)).xyz; //worldspace
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