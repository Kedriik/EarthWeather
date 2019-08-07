import {mat4} from 'gl-matrix';
import {vec4} from 'gl-matrix';
import {vec3} from 'gl-matrix';
import {quat} from 'gl-matrix';

export interface IRenderObject
{
    Size:number;
    Forward:vec3;
    Up:vec3;
    Position:vec3;
    Rotation:vec3;
    Speed:vec3;
    RotationSpeed:vec3;
    ModelMatrix:mat4;
    init(gl);
    draw(gl, ViewMatrix, ProjectionMatrix,buffers);
    animate(deltaTime,buffers);
    rotate(angle, axis);
    translate(vector);
}