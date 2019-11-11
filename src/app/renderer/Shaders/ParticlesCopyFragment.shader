#version 300 es
precision highp float;
layout (location = 0) out vec4 Back;
uniform sampler2D uFinal;
uniform vec2 uScreenSize;

void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x /= uScreenSize.x;
    uv.y /= uScreenSize.y;

    Back = .9*texture(uFinal, uv);
}