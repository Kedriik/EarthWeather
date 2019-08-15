#version 300 es
in vec2 aParticleIndex;
uniform sampler2D uParticlesPositions;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

float rand(const vec2 co) {
    float t = dot(vec2(12.9898, 78.233), co);
    return fract(sin(t) * (4375.85453 + t));
}
out vec3 WorldSpacePosition;
void main(void) {
    WorldSpacePosition = texelFetch(uParticlesPositions,ivec2(aParticleIndex),0).xyz;
    gl_Position 	=  /*uProjectionMatrix*uViewMatrix*/vec4((2.0*WorldSpacePosition)-1.0,1.0);
    gl_Position.z 	= 0.0;
    gl_PointSize 	= 3.0;
}