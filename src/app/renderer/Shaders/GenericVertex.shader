#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
out vec4 WorldSpaceNormal;
out vec4 WorldSpacePosition;
void main(void) {
    gl_Position =  uProjectionMatrix*uViewMatrix*uModelMatrix*vec4(aVertexPosition,1);
    /*
    float C = 1.0,
    near = 0.1,
    far = 100000.0;
    float depth;
    gl_Position.z=(2.0*log2(max(1.0/1000000.0,C*gl_Position.w + 1.0)) / log2(max(1.0/1000000.0,C*far + 1.0) )- 1.0) ;
    */
    WorldSpacePosition = uModelMatrix*vec4(aVertexPosition,1);
    WorldSpaceNormal   = normalize(uModelMatrix*vec4(aVertexNormal,0));
}