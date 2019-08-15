#version 300 es
precision highp float; 
uniform vec2 uScreenSize;
uniform sampler2D Color;
uniform sampler2D Normal;
uniform sampler2D Position;
uniform sampler2D ColorProperties;
uniform sampler2D Depth;
uniform vec3			uLightPosition;
uniform vec3			uLightColor;
uniform float			uLightPower;
uniform vec3			uCameraPosition;
out vec4 FinalColor;
void main(void){
	vec2 uv = gl_FragCoord.xy;
	uv.x/= uScreenSize.x;
	uv.y/= uScreenSize.y;
	vec4 color						= texture(Color, uv);
	vec4 normal						= texture(Normal,uv);
	vec4 position					= texture(Position,uv);
	vec4 depth  					= texture(Depth,uv);
	vec4 colorProperties			= texture(ColorProperties,uv);
	normal.xyz						= normalize(normal.xyz);
	normal.w  						= 0.0;
	if(colorProperties.z==1.0){
		FinalColor=vec4(color.xyz,1);
		return;
	}
	vec3 lightDir=normalize(uLightPosition.xyz - position.xyz);
	vec3 viewDir = normalize(uCameraPosition - position.xyz);
	vec3 halfwayDir = normalize(lightDir + viewDir); 
	float spec = pow(max(dot(normal.xyz, halfwayDir), 0.0), 100.0);
	vec3 diffuse=max(dot(normal.xyz,lightDir),0.0)*color.xyz*uLightColor;
	vec3 specular = uLightColor * spec * colorProperties.x;

	float attenuation=uLightPower/pow(distance(position.xyz,uLightPosition),2.0);
	diffuse*=attenuation;
	specular*=attenuation;
	vec3 lighting=specular+diffuse+0.1*color.xyz;
	FinalColor = vec4(lighting,colorProperties.y);
}