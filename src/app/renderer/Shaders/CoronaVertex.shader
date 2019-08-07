#version 300 es
in vec3 aVertexPosition;
precision highp float; 
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseModelMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uScreenSize;
out vec3 fPosition;
out vec3 Position_worldspace;
void main(void){
	float size=3500.0;
	vec3 CameraRight_worldspace = vec3(uViewMatrix[0][0], uViewMatrix[1][0], uViewMatrix[2][0]);
	vec3 CameraUp_worldspace = vec3(uViewMatrix[0][1], uViewMatrix[1][1], uViewMatrix[2][1]);
	vec4 particleCentre=uModelMatrix*vec4(0,0,0,1);
	vec3 position = particleCentre.xyz+CameraRight_worldspace*aVertexPosition.x*size+
	CameraUp_worldspace*aVertexPosition.y*size;
	gl_Position=uProjectionMatrix*uViewMatrix*vec4(position, 1);
	fPosition=(uModelMatrix*vec4(aVertexPosition,1.0)).xyz;
	float C = 1.0,
	near = 0.1,
	far = 10000000.0;
	gl_Position.z = (2.0*log2(max(1e-6,C*gl_Position.w + 1.0)) / log2(max(1e-6,C*far + 1.0) )- 1.0) * gl_Position.w;
	Position_worldspace = gl_Position.xyz;
}