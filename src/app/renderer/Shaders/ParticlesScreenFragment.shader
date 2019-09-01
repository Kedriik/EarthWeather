#version 300 es
precision highp float;
out vec4 Final;
uniform sampler2D uFinal;
uniform vec2 uScreenSize;

void main(void){
    vec2 uv = gl_FragCoord.xy;
    uv.x /= uScreenSize.x;
    uv.y /= uScreenSize.y;
    vec4 frontColor = texture(uFinal, uv);
    Final = frontColor;
}