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
    WorldSpacePosition = uModelMatrix*vec4(aVertexPosition,1.0);
    WorldSpaceNormal   = normalize(uModelMatrix*vec4(aVertexNormal,0));
}