#version 300 es
precision highp float;
layout (location = 0) out vec4 OutputPositions;
layout (location = 1) out vec4 DebugOutput;
uniform float uTime;
uniform float uDeltaTime;
uniform float uParticleLife;
uniform int   uParticleCount;
uniform sampler2D uParticlesPositions;
uniform sampler2D uWindVectors;

float rand(const vec2 co) {
    float t = dot(vec2(12.9898, 78.233), co);
    return fract(sin(t) * (4375.85453 + t));
}

void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x /= float(uParticleCount);
    uv.y /= float(uParticleCount);

    vec4 particlePosition   = textureGrad(uParticlesPositions,uv,vec2(0.0001),vec2(0.0001));
    particlePosition.w     -= uDeltaTime;

    if( particlePosition.w<=0.0|| rand(vec2(sin(uDeltaTime) , sin(uTime)) + particlePosition.xy) > 0.999){
        float x             = abs((rand(vec2(sin(uDeltaTime) , sin(uTime)) + uv)*100.0))/100.0;
        float y             = abs((rand(vec2(sin(uTime) , sin(uDeltaTime)) + uv)*100.0))/100.0;
        particlePosition.x  = x;
        particlePosition.y  = y;
        particlePosition.w  = 1000.0;//uParticleLife;  
        particlePosition.z  = 0.0;
    }


    //vec4 currentVelocity    = textureGrad(uWindVectors, particlePosition.xy,vec2(0.0001),vec2(0.0001));
    vec4 currentVelocity    = texture(uWindVectors, vec2(1.0-particlePosition.x,particlePosition.y));
    float speed = sqrt(pow(currentVelocity.y,2.0)+pow(currentVelocity.z,2.0));
    if(speed < 0.01){
        particlePosition.w = 0.0;
    }
    vec2 vel;
    
    float scale = 0.1;

    //particlePosition.x = particlePosition.x;// + (/*currentVelocity.z - */127.0/255.0);
    //particlePosition.y = particlePosition.y;// + (/*currentVelocity.y - */127.0/255.0);
    particlePosition.xy = particlePosition.xy + scale*uDeltaTime*(vec2(currentVelocity.zy - vec2(127.0/255.0)));
    particlePosition.x = abs(fract(particlePosition.x));
    particlePosition.y = abs(fract(particlePosition.y));
    //particlePosition.x = clamp(float(particlePosition.x),0.0,1.0);
    //particlePosition.y = clamp(float(particlePosition.y),0.0,1.0);
    OutputPositions = particlePosition;
}