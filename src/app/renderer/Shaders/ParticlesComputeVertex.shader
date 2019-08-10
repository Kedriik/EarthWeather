#version 300 es
in vec2 aParticleIndex;
out vec2 ParticleIndex;
void main(void) {
    ParticleIndex  = aParticleIndex;
}