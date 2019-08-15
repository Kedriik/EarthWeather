#version 300 es
precision highp float;
layout (location = 0) out vec4 Final;
uniform sampler2D uFront;
uniform vec2 uScreenSize;

void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x /= uScreenSize.x;
    uv.y /= uScreenSize.y;
    vec4 frontColor = texture(uFront, uv);
    Final = frontColor;
}