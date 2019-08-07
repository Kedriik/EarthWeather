import { mat4 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';
import { quat } from 'gl-matrix';
import { IRenderObject } from "src/app/renderer/IRenderObject";
import { GLHelpers } from 'src/app/renderer/glhelpers'
declare var require: any

export class Star implements IRenderObject {
  vsSource: string[] = [
    `#version 300 es
        in vec3 aVertexPosition;
        void main(void) {
          gl_Position =  vec4(aVertexPosition,1);
          gl_Position.z=0.0;
        }`
  ];
  fsSource: string[] = [
    `#version 300 es
        void main(void) {
          discard;
        }`
  ];
  SunProgram: any;
  SunProgramInfo: any;

  AtmosphereProgram: any;
  AtmosphereProgramInfo: any;
  AtmosphereSphereBuffers:any;
  AtmosphereSphereProgramInfo:any;
  AtmosphereLayerTexture:any;
  CoronaProgram: any;
  CoronaProgramInfo: any;
  hasAtmosphere = true;
  Size: number;
  Forward: vec3;
  Up: vec3
  Position: vec3;
  Rotation: vec3;
  Speed: vec3;
  RotationSpeed: vec3;
  ModelMatrix: mat4;

  ColorImage:any;
  ColorTexture:any;
  Color: vec3;
  Power: any;
  init(gl) {
    this.SunProgram = GLHelpers.initShaderProgram(gl, this.vsSource, require("raw-loader!./Shaders/SunRaymarcher.shader"));
    this.SunProgramInfo = {
      program: this.SunProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.SunProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(this.SunProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(this.SunProgram, 'uProjectionMatrix'),
        modelMatrix: gl.getUniformLocation(this.SunProgram, 'uModelMatrix'),
        viewMatrix: gl.getUniformLocation(this.SunProgram, 'uViewMatrix'),
        inverseViewMatrix: gl.getUniformLocation(this.SunProgram, 'uInverseViewMatrix'),
        inverseModelMatrix: gl.getUniformLocation(this.SunProgram, 'uInverseModelMatrix'),
        color: gl.getUniformLocation(this.SunProgram, 'uColor'),
        time: gl.getUniformLocation(this.SunProgram, 'uTime'),
        size: gl.getUniformLocation(this.SunProgram, 'uSize'),
        screenSize: gl.getUniformLocation(this.SunProgram, 'uScreenSize')
      },
    };

    this.AtmosphereProgram = GLHelpers.initShaderProgram(
      gl, this.vsSource, require("raw-loader!./Shaders/SunAtmosphereFragment.shader"));
      this.AtmosphereProgramInfo = {
      program: this.AtmosphereProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.AtmosphereProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        atmosphereLayer: gl.getUniformLocation(this.AtmosphereProgram, 'AtmosphereLayer'),
        positionSampler: gl.getUniformLocation(this.AtmosphereProgram, 'Position'),
        lightPower: gl.getUniformLocation(this.AtmosphereProgram, 'uLightPower'),
        lightPosition: gl.getUniformLocation(this.AtmosphereProgram, 'uLightPosition'),
        lightColor: gl.getUniformLocation(this.AtmosphereProgram, 'uLightColor'),
        planetSize: gl.getUniformLocation(this.AtmosphereProgram, 'uPlanetSize'),
        screenSize: gl.getUniformLocation(this.AtmosphereProgram, 'uScreenSize'),
        planetPosition: gl.getUniformLocation(this.AtmosphereProgram, 'uPlanetPosition'),
        cameraPosition: gl.getUniformLocation(this.AtmosphereProgram, 'uCameraPosition'),
        rayleigh: gl.getUniformLocation(this.AtmosphereProgram, 'uRayleigh'),
        mie: gl.getUniformLocation(this.AtmosphereProgram, 'uMie')

      },
    };
    this.AtmosphereSphereBuffers = GLHelpers.generateSphere(gl, 100, 100, 1);
    this.AtmosphereSphereProgramInfo = GLHelpers.createGenericShapeProgram(gl, require("raw-loader!./Shaders/GenericVertex.shader"), require("raw-loader!./Shaders/AtmosphereSphere.shader"));
    this.CoronaProgram = GLHelpers.initShaderProgram(gl, require("raw-loader!./Shaders/CoronaVertex.shader"), require("raw-loader!./Shaders/CoronaFragment.shader"));
    this.CoronaProgramInfo = {
      program: this.CoronaProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.CoronaProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(this.CoronaProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(this.CoronaProgram, 'uProjectionMatrix'),
        modelMatrix: gl.getUniformLocation(this.CoronaProgram, 'uModelMatrix'),
        viewMatrix: gl.getUniformLocation(this.CoronaProgram, 'uViewMatrix'),
        inverseViewMatrix: gl.getUniformLocation(this.CoronaProgram, 'uInverseViewMatrix'),
        inverseModelMatrix: gl.getUniformLocation(this.CoronaProgram, 'uInverseModelMatrix'),
        screenSize: gl.getUniformLocation(this.CoronaProgram, 'uScreenSize'),
        time: gl.getUniformLocation(this.CoronaProgram, 'uTime')
      },
    };


    this.Color = vec3.create();
    this.Position = vec3.create();
    this.Color[0] = 1.0;
    this.Color[1] = 1.0;
    this.Color[2] = 1.0;
    this.Position[0] = 0.0;///100000.0 - 10;
    this.Position[1] = 0.0;
    this.Position[2] = 0.0;
    this.Power = 20000000000.0;
    this.Size = 695.5;
    
  }
  draw(gl, ViewMatrix, ProjectionMatrix, buffers) {
    const sunModelMatrix = mat4.create();
    mat4.translate(sunModelMatrix,     // destination matrix
      sunModelMatrix,     // matrix to translate
      this.Position);  // amount to translate

    {
      const numComponents = 3;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        this.SunProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.SunProgramInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing

    gl.useProgram(this.SunProgramInfo.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
    gl.uniform1i(this.SunProgramInfo.uniformLocations.color, 0);
    // Set the shader uniforms
    gl.uniformMatrix4fv(
      this.SunProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      this.SunProgramInfo.uniformLocations.modelMatrix,
      false,
      sunModelMatrix);
    gl.uniformMatrix4fv(
      this.SunProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);

    gl.uniform1f(
      this.SunProgramInfo.uniformLocations.time,
      buffers.loopTotalTime
    )
    gl.uniform1f(
      this.SunProgramInfo.uniformLocations.size,
      this.Size
    )
    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);
    gl.uniformMatrix4fv(
      this.SunProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);
    let inverseSunModelMatrix = mat4.create();
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, sunModelMatrix);
    gl.uniformMatrix4fv(
      this.SunProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseSunModelMatrix
    )
    gl.uniform2f(
      this.SunProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )
    {
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
  drawCorona(gl, ViewMatrix, ProjectionMatrix, buffers) {
    const CoronaModelMatrix = mat4.create();
    mat4.translate(CoronaModelMatrix,     // destination matrix
      CoronaModelMatrix,     // matrix to translate
      this.Position);  // amount to translate

    {
      const numComponents = 3;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        this.CoronaProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.CoronaProgramInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing

    gl.useProgram(this.CoronaProgramInfo.program);
    // Set the shader uniforms
    gl.uniformMatrix4fv(
      this.CoronaProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      this.CoronaProgramInfo.uniformLocations.modelMatrix,
      false,
      CoronaModelMatrix);
    gl.uniformMatrix4fv(
      this.CoronaProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);
    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);
    gl.uniformMatrix4fv(
      this.CoronaProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);
    let inverseCoronaModelMatrix = mat4.create();
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, CoronaModelMatrix);
    gl.uniformMatrix4fv(
      this.CoronaProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseCoronaModelMatrix
    )
    gl.uniform2f(
      this.CoronaProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )
    gl.uniform1f(
      this.CoronaProgramInfo.uniformLocations.time,
      buffers.loopTotalTime
    )
    {
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
  drawDefferedAtmosphere(gl, buffers, ViewMatrix, ProjectionMatrix, DefferedShaderProgramInfo, LightPosition,
    LightColor, LightPower, camera, PositionTexture) {
    if (!this.hasAtmosphere)
      return;
    
    let AtmosphereModelMatrix: mat4;
    AtmosphereModelMatrix = mat4.create();
    this.ModelMatrix = mat4.create();
    let r = 1000.0;
    mat4.scale(AtmosphereModelMatrix, this.ModelMatrix, [r, r, r]);
    GLHelpers.genericDraw(gl, this.AtmosphereSphereBuffers, this.AtmosphereSphereProgramInfo, AtmosphereModelMatrix, ViewMatrix, ProjectionMatrix);
    gl.cullFace(gl.BACK);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
   
    {
      const numComponents = 3;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        DefferedShaderProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        DefferedShaderProgramInfo.attribLocations.vertexPosition);
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(this.AtmosphereProgramInfo.program);

    gl.uniform2f(
      this.AtmosphereProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )

    gl.uniform3f(
      this.AtmosphereProgramInfo.uniformLocations.lightPosition,
      LightPosition[0],
      LightPosition[1],
      LightPosition[2]
    );

    gl.uniform3f(
      this.AtmosphereProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    );

    gl.uniform1f(
      this.AtmosphereProgramInfo.uniformLocations.planetSize,
      this.Size
    )

    // gl.uniform4f(
    //   Planet.AtmosphereProgramInfo.uniformLocations.rayleigh,
    //   this.AtmosphereRayleigh[0],
    //   this.AtmosphereRayleigh[1],
    //   this.AtmosphereRayleigh[2],
    //   this.AtmosphereRayleigh[3]
    // );

    // gl.uniform4f(
    //   Planet.AtmosphereProgramInfo.uniformLocations.mie,
    //   this.AtmosphereMie[0],
    //   this.AtmosphereMie[1],
    //   this.AtmosphereMie[2],
    //   this.AtmosphereMie[3]
    // );

    // gl.uniform3f(
    //   Planet.AtmosphereProgramInfo.uniformLocations.lightColor,
    //   LightColor[0],
    //   LightColor[1],
    //   LightColor[2]
    // )
    // gl.uniform1f(
    //   Planet.AtmosphereProgramInfo.uniformLocations.lightPower,
    //   LightPower
    // );

    gl.uniform3f(
      this.AtmosphereProgramInfo.uniformLocations.cameraPosition,
      camera.Position[0],
      camera.Position[1],
      camera.Position[2]
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, PositionTexture);
    gl.uniform1i(this.AtmosphereProgramInfo.uniformLocations.positionSampler, 2);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.AtmosphereLayerTexture);
    gl.uniform1i(this.AtmosphereProgramInfo.uniformLocations.atmosphereLayer, 5);
    {
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
    gl.disable(gl.BLEND);
  }
  animate(deltaTime,buffers) {

  }
  rotate(angle, axis){
    if(axis == "forward" ){
      let rotateAroundVector=vec3.create();
      vec3.copy(rotateAroundVector,this.Forward);
      let rotateQuat=quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector,angle);
      let rotateMatrix=mat4.create();
      mat4.fromQuat(rotateMatrix,rotateQuat);
      let v4ForwardRotated=vec4.create();
      vec4.transformMat4(v4ForwardRotated,[this.Forward[0],this.Forward[1],this.Forward[2],0],rotateMatrix);
      let v4UpRotated=vec4.create();
      vec4.transformMat4(v4UpRotated,[this.Up[0],this.Up[1],this.Up[2],0],rotateMatrix);
      this.Forward[0]=v4ForwardRotated[0];
      this.Forward[1]=v4ForwardRotated[1];
      this.Forward[2]=v4ForwardRotated[2];
      this.Up[0]=v4UpRotated[0];
      this.Up[1]=v4UpRotated[1];
      this.Up[2]=v4UpRotated[2];
      mat4.multiply(this.ModelMatrix,this.ModelMatrix,rotateMatrix);
    }

    if(axis == "up" ){
      let rotateAroundVector=vec3.create();
      vec3.copy(rotateAroundVector,this.Up);
      let rotateQuat=quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector,angle);
      let rotateMatrix=mat4.create();
      mat4.fromQuat(rotateMatrix,rotateQuat);
      let v4ForwardRotated=vec4.create();
      vec4.transformMat4(v4ForwardRotated,[this.Forward[0],this.Forward[1],this.Forward[2],0],rotateMatrix);
      let v4UpRotated=vec4.create();
      vec4.transformMat4(v4UpRotated,[this.Up[0],this.Up[1],this.Up[2],0],rotateMatrix);
      this.Forward[0]=v4ForwardRotated[0];
      this.Forward[1]=v4ForwardRotated[1];
      this.Forward[2]=v4ForwardRotated[2];
      this.Up[0]=v4UpRotated[0];
      this.Up[1]=v4UpRotated[1];
      this.Up[2]=v4UpRotated[2];
      mat4.multiply(this.ModelMatrix,this.ModelMatrix,rotateMatrix);
    }

    if(axis == "right"){
      let rotateAroundVector=vec3.create();
      let right=vec3.create();
      let forward=vec3.create();
      let up=vec3.create();
      vec3.normalize(forward,this.Forward);
      vec3.normalize(up,this.Up);
      vec3.cross(right,forward,up);
      vec3.normalize(rotateAroundVector,right);
      let rotateQuat=quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector,angle);
      let rotateMatrix=mat4.create();
      mat4.fromQuat(rotateMatrix,rotateQuat);
      let v4ForwardRotated=vec4.create();
      vec4.transformMat4(v4ForwardRotated,[this.Forward[0],this.Forward[1],this.Forward[2],0],rotateMatrix);
      let v4UpRotated=vec4.create();
      vec4.transformMat4(v4UpRotated,[this.Up[0],this.Up[1],this.Up[2],0],rotateMatrix);
      this.Forward[0]=v4ForwardRotated[0];
      this.Forward[1]=v4ForwardRotated[1];
      this.Forward[2]=v4ForwardRotated[2];
      this.Up[0]=v4UpRotated[0];
      this.Up[1]=v4UpRotated[1];
      this.Up[2]=v4UpRotated[2];
      mat4.multiply(this.ModelMatrix,this.ModelMatrix,rotateMatrix);
    }
  }
  translate(vector){

  }
}