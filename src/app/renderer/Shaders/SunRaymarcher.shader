  #version 300 es
  precision highp float; 
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uInverseViewMatrix;
  uniform mat4 uInverseModelMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec2 uScreenSize;
  uniform float uTime;
  uniform float uSize;
  uniform sampler2D uColor;
  layout (location = 0) out vec4 OutputColor;
  layout (location = 1) out vec4 OutputNormal;
  layout (location = 2) out vec4 OutputPosition;
  layout (location = 3) out vec4 OutputColorProperties;
  ///////////////NOISE UTILITY////////////
 float PI=3.1415926535897932384626433832;
vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}
vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
}

//Classic 4D Perlin Noise
float cnoise(vec4 P){
  vec4 Pi0 = floor(P); // Integer part for indexing
  vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec4 Pf0 = fract(P); // Fractional part for interpolation
  vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.zzzz);
  vec4 iz1 = vec4(Pi1.zzzz);
  vec4 iw0 = vec4(Pi0.wwww);
  vec4 iw1 = vec4(Pi1.wwww);

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 ixy00 = permute(ixy0 + iw0);
  vec4 ixy01 = permute(ixy0 + iw1);
  vec4 ixy10 = permute(ixy1 + iw0);
  vec4 ixy11 = permute(ixy1 + iw1);

  vec4 gx00 = ixy00 / 7.0;
  vec4 gy00 = floor(gx00) / 7.0;
  vec4 gz00 = floor(gy00) / 6.0;
  gx00 = fract(gx00) - 0.5;
  gy00 = fract(gy00) - 0.5;
  gz00 = fract(gz00) - 0.5;
  vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
  vec4 sw00 = step(gw00, vec4(0.0));
  gx00 -= sw00 * (step(0.0, gx00) - 0.5);
  gy00 -= sw00 * (step(0.0, gy00) - 0.5);

  vec4 gx01 = ixy01 / 7.0;
  vec4 gy01 = floor(gx01) / 7.0;
  vec4 gz01 = floor(gy01) / 6.0;
  gx01 = fract(gx01) - 0.5;
  gy01 = fract(gy01) - 0.5;
  gz01 = fract(gz01) - 0.5;
  vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
  vec4 sw01 = step(gw01, vec4(0.0));
  gx01 -= sw01 * (step(0.0, gx01) - 0.5);
  gy01 -= sw01 * (step(0.0, gy01) - 0.5);

  vec4 gx10 = ixy10 / 7.0;
  vec4 gy10 = floor(gx10) / 7.0;
  vec4 gz10 = floor(gy10) / 6.0;
  gx10 = fract(gx10) - 0.5;
  gy10 = fract(gy10) - 0.5;
  gz10 = fract(gz10) - 0.5;
  vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
  vec4 sw10 = step(gw10, vec4(0.0));
  gx10 -= sw10 * (step(0.0, gx10) - 0.5);
  gy10 -= sw10 * (step(0.0, gy10) - 0.5);

  vec4 gx11 = ixy11 / 7.0;
  vec4 gy11 = floor(gx11) / 7.0;
  vec4 gz11 = floor(gy11) / 6.0;
  gx11 = fract(gx11) - 0.5;
  gy11 = fract(gy11) - 0.5;
  gz11 = fract(gz11) - 0.5;
  vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
  vec4 sw11 = step(gw11, vec4(0.0));
  gx11 -= sw11 * (step(0.0, gx11) - 0.5);
  gy11 -= sw11 * (step(0.0, gy11) - 0.5);

  vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
  vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
  vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
  vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
  vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
  vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
  vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
  vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
  vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
  vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
  vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
  vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
  vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
  vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
  vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
  vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

  vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
  g0000 *= norm00.x;
  g0100 *= norm00.y;
  g1000 *= norm00.z;
  g1100 *= norm00.w;

  vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
  g0001 *= norm01.x;
  g0101 *= norm01.y;
  g1001 *= norm01.z;
  g1101 *= norm01.w;

  vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
  g0010 *= norm10.x;
  g0110 *= norm10.y;
  g1010 *= norm10.z;
  g1110 *= norm10.w;

  vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
  g0011 *= norm11.x;
  g0111 *= norm11.y;
  g1011 *= norm11.z;
  g1111 *= norm11.w;

  float n0000 = dot(g0000, Pf0);
  float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
  float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
  float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
  float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
  float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
  float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
  float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
  float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
  float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
  float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
  float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
  float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
  float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
  float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
  float n1111 = dot(g1111, Pf1);

  vec4 fade_xyzw;
  fade_xyzw = fade(Pf0);
  vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
  vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
  vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
  vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
  float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
  return 2.2 * n_xyzw;
}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  //vIn*=100;
// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 1.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

////////////END OF NOISEUTILITY////////////////////////
float fbm_1(vec3 x,float a) {
  int NUM_OCTAVES=4;
  float v = 0.0;
 // float a = 100.5;
  vec3 shift = vec3(100);
  for (int i = 0; i < 4; ++i) {
    v += a * snoise(x);
    x = x * 2.0 + shift;
    a *= 0.5;
  }

  return v;
}

float fbm_2(vec4 x,float a, int octaves) {
  float v = 0.0;
 // float a = 100.5;
  vec4 shift = vec4(100);
  for (int i = 0; i < octaves; ++i) {
    v += a * cnoise(x);
    x = x * 2.0 + shift;
    a *= 0.5;
  }

  return v;
}

float RidgedMultifractal( vec3 point,float A, float freq){
    // float A, freq, H, lacunarity, octaves;
      /* get first octave */
 // 30,3, 8, 2, 0.25
  float lacunarity=2.7;
  //float freq=0.5;
  //float A=0.8;
  float signal;
  float offset=0.5;
  float gain=0.5;
  float frequency=freq, Amp=A;
  signal =(snoise(freq*point));

  // return signal;
  /* get absolute value of signal (this creates the ridges) */
  if ( signal < 0.0 ) signal = -1.0*signal;

  /* invert and translate (note that "offset" should be ~= 1.0) */
  // offset=10*A/1.5;;
  signal = offset - signal;
  /* square the signal, to increase "sharpness" of ridges */
  signal *= signal;
  /* assign initial values */
  float result = signal;
  float weight = 0.5;
  //return result;
  for( int i=1; i<3; i++ ) {
    
        /* increase the frequency */
        point.x *= lacunarity;
        point.y *= lacunarity;
        point.z *= lacunarity;

        /* weight successive contributions by previous signal */
        weight = signal * gain;
        if ( weight > 1.0 ) weight = 1.0;
        if ( weight < 0.0 ) weight = 0.0;
        signal = (snoise(freq*point));
        if ( signal < 0.0 ) signal = -signal;
        signal = offset - signal;
        signal *= signal;
        /* weight the contribution */
        signal *= weight;
        
        result += signal *A;// Weigths[i];
        A/=4.0;
  }
  return( result -0.1 );

} /* RidgedMultifractal() */

  float terrain(vec4 in_seed){
    vec3 seed=in_seed.xyz;
    float f=0.2, A=2.1;
    float RMA=1.0, RMF=100.0;
    float terrainProp=fbm_1(f*seed,A);
    float h=atan(terrainProp);
    h/=50.0;
    if(h>0.0){
      f=100.5;
      RMA=100.5;
      RMF=0.7;
      A=0.001;
      float terrainProp1=snoise(f*seed);
      float threshold = 0.01;
      h+=clamp(terrainProp,0.0,1.0)*(pow(RidgedMultifractal(seed,RMA,RMF),2.0))/1.0;
    }
    else{
      A=0.4;
      f=2.0;
     h+=fbm_1(f*seed,A); 
    }
    return h;
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
  vec3 color=vec3(0,1,0);
  vec3 materialProp;
  vec3 sun_color=vec3(252.0/255.0,212.0/255.0,64.0/255.0);
  vec2 coordinates(vec3 dir){
    float u = ((atan(dir.x, dir.z) / PI) + 1.0f) * 0.5f;
    float v = (asin(dir.y) / PI) + 0.5f;
    return vec2(u,v);//(coords);
  }
  vec3 yellow = vec3(1.0,211.0/255.0,0.0);
  vec3 yellow1 = vec3(250.0/255.0,211.0/255.0,0.0);
  vec3 orange = vec3(1.0,165.0/255.0,0.0);
  vec3 orange1 = vec3(1.0,140.0/255.0,0.0);
  vec3 orange2 = vec3(1.0,102.0/255.0,0.0);
  vec3 white = vec3(1.0);
  vec3 _dir;
  vec4 spherePos;
  vec3 dir;
  vec4 seed;
  float dist;
  float h;
  vec2 coords;
  float sun(in vec3 p){
    spherePos=vec4(0,0,0,1);
    spherePos=uViewMatrix*uModelMatrix*spherePos;
    dir=normalize(p-spherePos.xyz);
    dir=(uInverseModelMatrix*uInverseViewMatrix*vec4(dir,0)).xyz;
    seed=vec4(uSize*dir,1);
    dist=distance(p,spherePos.xyz) - uSize;

    _dir = dir;
    return dist;
  }
  float sceneSDF(in vec3 p)
  {
    return sun(p);
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

// vec4 yellow=vec4(244.0f/255.0f,229.0f/255.0f,66.0f/255.0f,1);
// vec4 orange=vec4(244.0f/255.0f, 173.0f/255.0f, 66.0f/255.0f,1);
// vec4 white=vec4(1.0f, 1.0f, 1.0f, 1);

void main(void) {
  //OutputColor = vec4(0,0,0,1);
  
  vec4 cameraPos=vec4(0,0,0,1);
  vec3 ray;
  ray = rayDirection(45.0, uScreenSize, gl_FragCoord.xy);//normalize(ray);
  float depth = 0.0;
  float epsilon=0.00001;
  vec3 p;
  for(int i=0; i<8; i++){
    p = cameraPos.xyz + depth * ray;
    depth = depth += sceneSDF(p);      
  }
  p = cameraPos.xyz + depth * ray;
  if(abs(sceneSDF(p)) < 0.1){
    vec3 y1Offset = vec3(111.0);
    vec3 oOffset = vec3(222.0);
    vec3 o1Offset = vec3(333.0);
        float A=1.0;
    int octaves = 4;
    float f=5.0;
    float time = uTime*0.1;
    color = yellow1;
    vec3 normal=estimateNormal(p);
    normal=(uInverseViewMatrix*vec4(normal,0.0)).xyz;
    p=(uInverseViewMatrix*vec4(p,1.0)).xyz;
    OutputNormal.xyz=normal;
    OutputNormal.w=1.0;
    OutputPosition.xyz=p;
    OutputPosition.w=1.0;
    OutputColor.xyz=color;
    OutputColor.w=1.0;
    OutputColorProperties.xyz=vec3(0,1,1);
    OutputColorProperties.w=1.0;
     vec4 Pclip = uProjectionMatrix*uViewMatrix * vec4 (p, 1);
    
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