#version 300 es
precision highp float;
out vec4 Final;
uniform sampler2D uFinal;
uniform sampler2D uNormals;
uniform sampler2D uPositions;
uniform vec2 uScreenSize;
uniform vec3 uLightPosition;
void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x /= uScreenSize.x;
    uv.y /= uScreenSize.y;
    vec4 frontColor = texture(uFinal, uv);
    vec4 normal		= texture(uNormals,uv);
    vec4 position	= texture(uPositions,uv);
    
    vec3 lightDir=normalize(uLightPosition.xyz - position.xyz);
	vec3 diffuse=max(dot(normal.xyz,lightDir),0.0)*vec3(1.0);

    Final = vec4(diffuse+vec3(0.3), frontColor.w);
}