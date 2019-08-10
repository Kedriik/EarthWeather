#version 300 es
precision highp float;
uniform float uTime;
uniform float uDeltaTime;
uniform float uParticleLife;
uniform sampler2D uParticlesPositions;
uniform sampler2D uWindVectors;
layout (location = 0) out vec4 OutputPositions;

float rand(const vec2 co) {
    float t = dot(vec2(12.9898, 78.233), co);
    return fract(sin(t) * (4375.85453 + t));
}

in vec2 ParticleIndex;
void main(void){
    float halfrange = 255.0/2.0;
    vec4 particlePosition = texture(uParticlesPositions,ParticleIndex);
    if(particlePosition.w <= 0.0){
        float x = rand(vec2(uTime))*360.0;
        float y = rand(vec2(uTime))*180.0;
        particlePosition.x  = x;
        particlePosition.y  = y;
        particlePosition.w  = uParticleLife;  
    }
    vec4 currentVelocity    = texture(uWindVectors, particlePosition.xy);
    //float currentSpeed = sqrt(pow(currentVelocity.x,2.0)+pow(currentVelocity.y,2.0));
    particlePosition.xy     = (currentVelocity.xy - vec2(halfrange)) * uDeltaTime;
    OutputPositions         = vec4(particlePosition.xy,0.0,0.0);
}