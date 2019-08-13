#version 300 es
precision highp float;
layout (location = 0) out vec4 OutputPositions;
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
    float halfrange = 255.0/2.0;
    vec4 particlePosition = texture(uParticlesPositions,uv);
    vec4 currentVelocity    = texture(uWindVectors, particlePosition.xy);
    vec2 vel;
    vel.xy = vec2(currentVelocity.yz - vec2(0.5));
    float speed = sqrt(pow(vel.x,2.0)+pow(vel.y,2.0));
    particlePosition.w -= uDeltaTime;

    if(particlePosition.w <=0.0){//rand(vec2(sin(uDeltaTime) , sin(uTime)) + particlePosition.xy)>0.99){
        float x             = (rand(vec2(sin(uDeltaTime) , sin(uTime)) + uv)*100.0)/100.0;
        float y             = (rand(vec2(sin(uTime) , sin(uDeltaTime)) + uv)*100.0)/100.0;
        particlePosition.x  = x;
        particlePosition.y  = y;
        particlePosition.w  = 1000.0;//uParticleLife;  
        particlePosition.z  = 0.0;
    }

    // if(speed<0.01){
    //     particlePosition.w = 1.0;
    // }
    
    //float currentSpeed = sqrt(pow(currentVelocity.x,2.0)+pow(currentVelocity.y,2.0));
    float scale = 10.0;

    particlePosition.xy     += scale * (vel) * uDeltaTime;
    //particlePosition.xy = clamp(particlePosition.xy0.0,1.0)
    if(particlePosition.x > 1.0){
        particlePosition.x = 0.0;
    }
    else if(particlePosition.x<=0.0){
        particlePosition.x = 1.0;
    }
    if(particlePosition.y > 1.0){
        particlePosition.y = 0.0;
    }
    else if(particlePosition.y<=0.0){
        particlePosition.y = 1.0;
    }
    OutputPositions = particlePosition;
}

//TODO: vec2(128.0/255.0,129.0/255.0) <- why this is halfrange offset not 128/255 ???