import { mat4 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';
import { quat } from 'gl-matrix';
import { IRenderObject } from "src/app/renderer/IRenderObject";
import { GLHelpers } from 'src/app/renderer/glhelpers'
import { InputTracker } from 'src/app/renderer/inputTracker'
import { Camera } from 'src/app/renderer/Camera'

import { NgModuleProviderDef } from '@angular/core/src/view';
declare var require: any
export class Planet implements IRenderObject {
  static vsSource: string[] = [
    `#version 300 es
    in vec3 aVertexPosition;
    void main(void) {
      gl_Position =  vec4(aVertexPosition,1);
      gl_Position.z=0.0;
    }`
  ];
  static fsSource: string[] = [
    `#version 300 es
    void main(void) {
      discard;
    }`
  ];

  static AtmosphereLayerTexture: any;
  static CloudsLayerTexture: any;
  static PlanetProgram: any;
  static PlanetProgramInfo: any;
  static AtmosphereProgram: any;
  static AtmosphereProgramInfo: any;
  static AtmosphereSphereBuffers: any;
  static AtmosphereSphereProgramInfo: any;
  static CloudsSphereBuffers: any;
  static CloudsSphereProgramInfo: any;
  static OceanProgram: any;
  static OceanProgramInfo: any;
  static camera: Camera;
  static PlaneBuffers: any;
  static MyCurrentRenderer: any;
  DefferedCloudsProgram: any;
  DefferedCloudsProgramInfo: any;
  WindDirsProgram: any;
  WindDirsProgramInfo: any;
  ColorPath: any;
  PlanetName: string;
  TopologyImage: any;
  TopologyTexture: any;
  ColorImage: any;
  ColorTexture: any;
  CloudsImage: any;
  CloudsTexture: any;
  BlueSpec: number = 0;
  Emissive: number = 0;
  RingsImage: any;
  RingsTexture: any;
  RingsBuffer: any;
  RingsModelMatrix: any;
  RingsProgram: any;
  RingsProgramInfo: any;
  deltaTime: number;
  ModelMatrix: mat4;
  AtmosphereModelMatrix: mat4

  AtmosphereRayleigh: vec4;
  AtmosphereMie: vec4;
  Mode: number = 1;
  hasClouds: boolean;
  hasOceans: boolean;
  hasAtmosphere: boolean;
  RaymarchSteps: number = 8;
  //Size is 1 per 1000 real km
  Size: number;

  Forward: vec3;
  Up: vec3;
  Position: vec3;

  Rotation: vec3;
  Speed: vec3;
  RotationSpeed: vec3; //[0] - forward vector, [1] = up, [2] = right

  RotationOrigin: vec3;
  DistanceToOrigin: number;
  AngularSpeed: number = 1; //1 earth orbit per 1h


  init(gl) {
    Planet.PlanetProgram = GLHelpers.initShaderProgram(gl, Planet.vsSource, require("raw-loader!./Shaders/PlanetRaymarcher.shader"));
    Planet.PlanetProgramInfo = {
      program: Planet.PlanetProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(Planet.PlanetProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(Planet.PlanetProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(Planet.PlanetProgram, 'uProjectionMatrix'),
        topologyMap: gl.getUniformLocation(Planet.PlanetProgram, 'TopologyMap'),
        colorMap: gl.getUniformLocation(Planet.PlanetProgram, 'ColorMap'),
        modelMatrix: gl.getUniformLocation(Planet.PlanetProgram, 'uModelMatrix'),
        planetPosition: gl.getUniformLocation(Planet.PlanetProgram, 'uPlanetPosition'),
        planetSize: gl.getUniformLocation(Planet.PlanetProgram, 'uPlanetSize'),
        viewMatrix: gl.getUniformLocation(Planet.PlanetProgram, 'uViewMatrix'),
        inverseViewMatrix: gl.getUniformLocation(Planet.PlanetProgram, 'uInverseViewMatrix'),
        inverseModelMatrix: gl.getUniformLocation(Planet.PlanetProgram, 'uInverseModelMatrix'),
        screenSize: gl.getUniformLocation(Planet.PlanetProgram, 'uScreenSize'),
        blueSpec: gl.getUniformLocation(Planet.PlanetProgram, 'uBlueSpec'),
        emissive: gl.getUniformLocation(Planet.PlanetProgram, 'uEmissive'),
        raymarchSteps: gl.getUniformLocation(Planet.PlanetProgram, 'uRaymarchSteps'),
        atmosphereLayer: gl.getUniformLocation(Planet.PlanetProgram, 'AtmosphereLayer')
      },
    };
    Planet.AtmosphereProgram = GLHelpers.initShaderProgram(gl, Planet.vsSource, require("raw-loader!./Shaders/AtmosphereFragment.shader"));
    Planet.AtmosphereProgramInfo = {
      program: Planet.AtmosphereProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(Planet.AtmosphereProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        atmosphereLayer: gl.getUniformLocation(Planet.AtmosphereProgram, 'AtmosphereLayer'),
        positionSampler: gl.getUniformLocation(Planet.AtmosphereProgram, 'Position'),
        lightPower: gl.getUniformLocation(Planet.AtmosphereProgram, 'uLightPower'),
        lightPosition: gl.getUniformLocation(Planet.AtmosphereProgram, 'uLightPosition'),
        lightColor: gl.getUniformLocation(Planet.AtmosphereProgram, 'uLightColor'),
        planetSize: gl.getUniformLocation(Planet.AtmosphereProgram, 'uPlanetSize'),
        screenSize: gl.getUniformLocation(Planet.AtmosphereProgram, 'uScreenSize'),
        planetPosition: gl.getUniformLocation(Planet.AtmosphereProgram, 'uPlanetPosition'),
        cameraPosition: gl.getUniformLocation(Planet.AtmosphereProgram, 'uCameraPosition'),
        rayleigh: gl.getUniformLocation(Planet.AtmosphereProgram, 'uRayleigh'),
        mie: gl.getUniformLocation(Planet.AtmosphereProgram, 'uMie')

      },
    };


    this.DefferedCloudsProgram = GLHelpers.initShaderProgram(gl, Planet.vsSource, require("raw-loader!./Shaders/EarthCloudsFragment.shader"));
    this.DefferedCloudsProgramInfo = {
      program: this.DefferedCloudsProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.DefferedCloudsProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(this.DefferedCloudsProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(this.DefferedCloudsProgram, 'uProjectionMatrix'),
        topologyMap: gl.getUniformLocation(this.DefferedCloudsProgram, 'TopologyMap'),
        colorMap: gl.getUniformLocation(this.DefferedCloudsProgram, 'ColorMap'),
        modelMatrix: gl.getUniformLocation(this.DefferedCloudsProgram, 'uModelMatrix'),
        planetPosition: gl.getUniformLocation(this.DefferedCloudsProgram, 'uPlanetPosition'),
        planetSize: gl.getUniformLocation(this.DefferedCloudsProgram, 'uPlanetSize'),
        viewMatrix: gl.getUniformLocation(this.DefferedCloudsProgram, 'uViewMatrix'),
        inverseViewMatrix: gl.getUniformLocation(this.DefferedCloudsProgram, 'uInverseViewMatrix'),
        inverseModelMatrix: gl.getUniformLocation(this.DefferedCloudsProgram, 'uInverseModelMatrix'),
        screenSize: gl.getUniformLocation(this.DefferedCloudsProgram, 'uScreenSize')
      },
    };

    this.WindDirsProgram = GLHelpers.initShaderProgram(gl, Planet.vsSource, require("raw-loader!./Shaders/WindDirsFragment.shader"));
    this.WindDirsProgramInfo = {
      program: this.WindDirsProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.WindDirsProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(this.WindDirsProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(this.WindDirsProgram, 'uProjectionMatrix'),
        topologyMap: gl.getUniformLocation(this.WindDirsProgram, 'TopologyMap'),
        colorMap: gl.getUniformLocation(this.WindDirsProgram, 'ColorMap'),
        modelMatrix: gl.getUniformLocation(this.WindDirsProgram, 'uModelMatrix'),
        planetPosition: gl.getUniformLocation(this.WindDirsProgram, 'uPlanetPosition'),
        planetSize: gl.getUniformLocation(this.WindDirsProgram, 'uPlanetSize'),
        viewMatrix: gl.getUniformLocation(this.WindDirsProgram, 'uViewMatrix'),
        inverseViewMatrix: gl.getUniformLocation(this.WindDirsProgram, 'uInverseViewMatrix'),
        inverseModelMatrix: gl.getUniformLocation(this.WindDirsProgram, 'uInverseModelMatrix'),
        screenSize: gl.getUniformLocation(this.WindDirsProgram, 'uScreenSize')
      },
    };

    Planet.AtmosphereSphereBuffers = GLHelpers.generateSphere(gl, 50, 50, 1);
    Planet.CloudsSphereBuffers = Planet.AtmosphereSphereBuffers;//GLHelpers.generateSphere(gl, 100, 100, 1);

    Planet.AtmosphereSphereProgramInfo = GLHelpers.createGenericShapeProgram(gl, require("raw-loader!./Shaders/GenericVertex.shader"), require("raw-loader!./Shaders/AtmosphereSphere.shader"));

    Planet.PlaneBuffers = GLHelpers.generatePlane(gl, 100, 100);

    this.Size = 10.0;
    this.AtmosphereMie = vec4.create();
    this.AtmosphereRayleigh = vec4.create();
    this.AtmosphereRayleigh[0] = 1.5 / 10;
    this.AtmosphereRayleigh[1] = 4.0 / 10;
    this.AtmosphereRayleigh[2] = 8.0 / 10;
    this.AtmosphereRayleigh[3] = 0.2;

    this.AtmosphereMie[0] = 5.0 / 1000000;
    this.AtmosphereMie[1] = 5.0 / 1000000;
    this.AtmosphereMie[2] = 5.0 / 1000000;
    this.AtmosphereMie[3] = 0.1;
    this.RotationOrigin = vec3.create();
    this.TopologyImage = new Image();
    this.ColorImage = new Image();
    //this.CloudsImage = new Image();

    if (this.PlanetName == "Earth") {
      this.TopologyImage.src = require('./Textures/earth_topology_h1.jpg');
      this.ColorImage.src = require('./Textures/earth_color.jpg');
      //this.CloudsImage.src = require('./Textures/clouds.jpg');
      this.BlueSpec = 1.0;
      this.DistanceToOrigin = 149600;
      this.AngularSpeed = 1.0;

    }

    this.TopologyImage.onload = () => {
      this.TopologyTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.TopologyTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.TopologyImage.width,
        this.TopologyImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.TopologyImage)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      Planet.MyCurrentRenderer.bStartCouting += 1;
    }

    this.ColorImage.onload = () => {
      this.ColorTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.ColorImage.width,
        this.ColorImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.ColorImage)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      Planet.MyCurrentRenderer.bStartCouting += 1;
    }

    this.CloudsImage.onload = () => {
      this.CloudsTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.CloudsTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.CloudsImage.width,
        this.CloudsImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.CloudsImage)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      Planet.MyCurrentRenderer.bStartCouting += 1;
    }
    let r = 10;
    this.AtmosphereRayleigh[0] = 1.5 / r;
    this.AtmosphereRayleigh[1] = 4.0 / r;
    this.AtmosphereRayleigh[2] = 8.0 / r;
    this.AtmosphereRayleigh[3] = 0.2

    let mie = 5.0 / 10000000
    this.AtmosphereMie[0] = mie;
    this.AtmosphereMie[1] = mie;
    this.AtmosphereMie[2] = mie;
    this.AtmosphereMie[3] = 0.1;

    this.Size = 6.5;

    this.ModelMatrix = mat4.create();
    this.RotationSpeed = vec3.create();
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    this.Speed = vec3.create();
    this.RotationSpeed = vec3.create();
    this.Rotation = vec3.create();
    this.Position = vec3.create();
    this.Forward = vec3.create();
    this.Up = vec3.create();
    this.Forward[2] = -1;
    this.Up[1] = 1;

    this.hasAtmosphere = false;
    this.hasClouds = false;
    this.hasOceans = false;
    // this.DistanceToOrigin/= 1000;

    this.Size;
  }
  draw(gl, ViewMatrix, ProjectionMatrix, buffers) {
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        Planet.PlanetProgramInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0);
      gl.enableVertexAttribArray(
        Planet.PlanetProgramInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing

    gl.useProgram(Planet.PlanetProgramInfo.program);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this.TopologyTexture);
    gl.uniform1i(Planet.PlanetProgramInfo.uniformLocations.topologyMap, 6);

    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, this.ColorTexture);
    gl.uniform1i(Planet.PlanetProgramInfo.uniformLocations.colorMap, 7);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, Planet.AtmosphereLayerTexture);
    gl.uniform1i(Planet.PlanetProgramInfo.uniformLocations.atmosphereLayer, 5);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
      Planet.PlanetProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      Planet.PlanetProgramInfo.uniformLocations.modelMatrix,
      false,
      this.ModelMatrix);

    gl.uniform3f(
      Planet.PlanetProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    )

    gl.uniform1f(
      Planet.PlanetProgramInfo.uniformLocations.planetSize,
      this.Size
    )

    gl.uniform1i(
      Planet.PlanetProgramInfo.uniformLocations.raymarchSteps,
      this.RaymarchSteps
    )

    gl.uniform1f(
      Planet.PlanetProgramInfo.uniformLocations.emissive,
      this.Emissive
    )

    gl.uniform1f(
      Planet.PlanetProgramInfo.uniformLocations.blueSpec,
      this.BlueSpec
    )
    gl.uniformMatrix4fv(
      Planet.PlanetProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);

    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);

    gl.uniformMatrix4fv(
      Planet.PlanetProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, this.ModelMatrix);
    gl.uniformMatrix4fv(
      Planet.PlanetProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseModelMatrix
    )
    gl.uniform2f(
      Planet.PlanetProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )
    {
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
  }
  markFootprint(gl, ViewMatrix, ProjectionMatrix, ) {
    let AtmosphereModelMatrix: mat4;
    AtmosphereModelMatrix = mat4.create();
    let r = this.Size + 1.0;
    mat4.scale(AtmosphereModelMatrix, this.ModelMatrix, [r, r, r]);
    GLHelpers.genericDraw(gl, Planet.AtmosphereSphereBuffers, Planet.AtmosphereSphereProgramInfo, AtmosphereModelMatrix, ViewMatrix, ProjectionMatrix);
    //
  }
  markWindSpeeds(gl, ViewMatrix, ProjectionMatrix, buffers, cloudsTexture) {
    gl.useProgram(this.WindDirsProgramInfo.program);
    const numComponents = 3;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(
      this.WindDirsProgramInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      this.WindDirsProgramInfo.attribLocations.vertexPosition);


    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, cloudsTexture);
    gl.uniform1i(this.WindDirsProgramInfo.uniformLocations.colorMap, 7);
    // Set the shader uniforms

    gl.uniformMatrix4fv(
      this.WindDirsProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      this.WindDirsProgramInfo.uniformLocations.modelMatrix,
      false,
      this.ModelMatrix);

    gl.uniform3f(
      this.WindDirsProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    )

    let atmosphereSize = this.Size + 0.1;
    gl.uniform1f(
      this.WindDirsProgramInfo.uniformLocations.planetSize,
      atmosphereSize
    )
    gl.uniformMatrix4fv(
      this.WindDirsProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);

    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);

    gl.uniformMatrix4fv(
      this.WindDirsProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, this.ModelMatrix);
    gl.uniformMatrix4fv(
      this.WindDirsProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseModelMatrix
    )
    gl.uniform2f(
      this.WindDirsProgramInfo.uniformLocations.screenSize,
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
  drawClassicClouds(gl, ViewMatrix, ProjectionMatrix, buffers, cloudsTexture = this.CloudsTexture) {
    {
      gl.useProgram(this.DefferedCloudsProgramInfo.program);
      const numComponents = 3;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        this.DefferedCloudsProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.DefferedCloudsProgramInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, cloudsTexture);
    gl.uniform1i(this.DefferedCloudsProgramInfo.uniformLocations.colorMap, 7);
    // Set the shader uniforms

    gl.uniformMatrix4fv(
      this.DefferedCloudsProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      this.DefferedCloudsProgramInfo.uniformLocations.modelMatrix,
      false,
      this.ModelMatrix);

    gl.uniform3f(
      this.DefferedCloudsProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    )

    let atmosphereSize = this.Size + 0.1;
    gl.uniform1f(
      this.DefferedCloudsProgramInfo.uniformLocations.planetSize,
      atmosphereSize
    )
    gl.uniformMatrix4fv(
      this.DefferedCloudsProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);

    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);

    gl.uniformMatrix4fv(
      this.DefferedCloudsProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, this.ModelMatrix);
    gl.uniformMatrix4fv(
      this.DefferedCloudsProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseModelMatrix
    )
    gl.uniform2f(
      this.DefferedCloudsProgramInfo.uniformLocations.screenSize,
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
  drawOcean(gl, ViewMatrix, ProjectionMatrix, buffers) {
    {
      if (!this.hasOceans)
        return;
      const numComponents = 3;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        Planet.OceanProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        Planet.OceanProgramInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(Planet.OceanProgramInfo.program);
    // Set the shader uniforms

    gl.uniformMatrix4fv(
      Planet.OceanProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);
    gl.uniformMatrix4fv(
      Planet.OceanProgramInfo.uniformLocations.modelMatrix,
      false,
      this.ModelMatrix);
    gl.uniform3f(
      Planet.OceanProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    )
    gl.uniformMatrix4fv(
      Planet.OceanProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);
    let inverseViewMatrix = mat4.create();
    mat4.invert(inverseViewMatrix, ViewMatrix);
    let inverseModelMatrix = mat4.create();
    mat4.invert(inverseModelMatrix, this.ModelMatrix);
    gl.uniformMatrix4fv(
      Planet.OceanProgramInfo.uniformLocations.inverseViewMatrix,
      false,
      inverseViewMatrix);

    gl.uniformMatrix4fv(
      Planet.OceanProgramInfo.uniformLocations.inverseModelMatrix,
      false,
      inverseModelMatrix
    )
    gl.uniform2f(
      Planet.OceanProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )
    gl.uniform1f(
      Planet.OceanProgramInfo.uniformLocations.planetSize,
      this.Size
    )

    {
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
  animate(deltaTime, buffers) {
    // //scaling FIRST, and THEN the rotation, and THEN the translation
    this.AtmosphereModelMatrix = mat4.create();
  }
  drawDefferedAtmosphere(gl, buffers, ViewMatrix, ProjectionMatrix, DefferedShaderProgramInfo, LightPosition,
    LightColor, LightPower, camera, PositionTexture) {

    gl.cullFace(gl.BACK);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

      gl.vertexAttribPointer(
        DefferedShaderProgramInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0);
      gl.enableVertexAttribArray(
        DefferedShaderProgramInfo.attribLocations.vertexPosition);
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(Planet.AtmosphereProgramInfo.program);

    gl.uniform2f(
      Planet.AtmosphereProgramInfo.uniformLocations.screenSize,
      buffers.canvas.clientWidth,
      buffers.canvas.clientHeight
    )

    gl.uniform3f(
      Planet.AtmosphereProgramInfo.uniformLocations.lightPosition,
      LightPosition[0],
      LightPosition[1],
      LightPosition[2]
    );

    gl.uniform3f(
      Planet.AtmosphereProgramInfo.uniformLocations.planetPosition,
      this.Position[0],
      this.Position[1],
      this.Position[2]
    );

    gl.uniform1f(
      Planet.AtmosphereProgramInfo.uniformLocations.planetSize,
      this.Size
    )

    gl.uniform4f(
      Planet.AtmosphereProgramInfo.uniformLocations.rayleigh,
      this.AtmosphereRayleigh[0],
      this.AtmosphereRayleigh[1],
      this.AtmosphereRayleigh[2],
      this.AtmosphereRayleigh[3]
    );

    gl.uniform4f(
      Planet.AtmosphereProgramInfo.uniformLocations.mie,
      this.AtmosphereMie[0],
      this.AtmosphereMie[1],
      this.AtmosphereMie[2],
      this.AtmosphereMie[3]
    );

    gl.uniform3f(
      Planet.AtmosphereProgramInfo.uniformLocations.lightColor,
      LightColor[0],
      LightColor[1],
      LightColor[2]
    )
    gl.uniform1f(
      Planet.AtmosphereProgramInfo.uniformLocations.lightPower,
      LightPower
    );

    gl.uniform3f(
      Planet.AtmosphereProgramInfo.uniformLocations.cameraPosition,
      camera.Position[0],
      camera.Position[1],
      camera.Position[2]
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, PositionTexture);
    gl.uniform1i(Planet.AtmosphereProgramInfo.uniformLocations.positionSampler, 2);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, Planet.AtmosphereLayerTexture);
    gl.uniform1i(Planet.AtmosphereProgramInfo.uniformLocations.atmosphereLayer, 5);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.disable(gl.BLEND);
  }

  rotate(angle, axis) {
    if (axis == "forward") {
      let rotateAroundVector = vec3.create();
      vec3.copy(rotateAroundVector, this.Forward);
      let rotateQuat = quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector, angle);
      let rotateMatrix = mat4.create();
      mat4.fromQuat(rotateMatrix, rotateQuat);
      let v4ForwardRotated = vec4.create();
      vec4.transformMat4(v4ForwardRotated, [this.Forward[0], this.Forward[1], this.Forward[2], 0], rotateMatrix);
      let v4UpRotated = vec4.create();
      vec4.transformMat4(v4UpRotated, [this.Up[0], this.Up[1], this.Up[2], 0], rotateMatrix);
      mat4.multiply(this.ModelMatrix, this.ModelMatrix, rotateMatrix);
      if (this.hasAtmosphere == true) {
        mat4.multiply(this.AtmosphereModelMatrix, this.AtmosphereModelMatrix, rotateMatrix);
      }
    }

    if (axis == "up") {
      let rotateAroundVector = vec3.create();
      vec3.copy(rotateAroundVector, this.Up);
      let rotateQuat = quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector, angle);
      let rotateMatrix = mat4.create();
      mat4.fromQuat(rotateMatrix, rotateQuat);
      let v4ForwardRotated = vec4.create();
      vec4.transformMat4(v4ForwardRotated, [this.Forward[0], this.Forward[1], this.Forward[2], 0], rotateMatrix);
      let v4UpRotated = vec4.create();
      vec4.transformMat4(v4UpRotated, [this.Up[0], this.Up[1], this.Up[2], 0], rotateMatrix);
      mat4.multiply(this.ModelMatrix, this.ModelMatrix, rotateMatrix);
      if (this.hasAtmosphere == true) {
        mat4.multiply(this.AtmosphereModelMatrix, this.AtmosphereModelMatrix, rotateMatrix);
      }
    }

    if (axis == "right") {
      let rotateAroundVector = vec3.create();
      let right = vec3.create();
      let forward = vec3.create();
      let up = vec3.create();
      vec3.normalize(forward, this.Forward);
      vec3.normalize(up, this.Up);
      vec3.cross(right, forward, up);
      vec3.normalize(rotateAroundVector, right);
      let rotateQuat = quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector, angle);
      let rotateMatrix = mat4.create();
      mat4.fromQuat(rotateMatrix, rotateQuat);
      let v4ForwardRotated = vec4.create();
      vec4.transformMat4(v4ForwardRotated, [this.Forward[0], this.Forward[1], this.Forward[2], 0], rotateMatrix);
      let v4UpRotated = vec4.create();
      vec4.transformMat4(v4UpRotated, [this.Up[0], this.Up[1], this.Up[2], 0], rotateMatrix);
      mat4.multiply(this.ModelMatrix, this.ModelMatrix, rotateMatrix);
      if (this.hasAtmosphere == true) {
        mat4.multiply(this.AtmosphereModelMatrix, this.AtmosphereModelMatrix, rotateMatrix);
      }
    }
  }

  translate(vector) {
    this.Position[0] += vector[0];
    this.Position[1] += vector[1];
    this.Position[2] += vector[2];
  }

  initRingBuffers(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Now create an array of positions for the square.
    const positions = [
      // Front face
      -1.0, 0.0, -1.0,
      1.0, 0.0, -1.0,
      1.0, 0.0, 1.0,
      -1.0, 0.0, 1.0
    ];
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(positions),
      gl.STATIC_DRAW);
    const faceColors = [
      [1.0, 1.0, 1.0, 1.0],    // Front face: white
      [1.0, 0.0, 0.0, 1.0],    // Back face: red
      [0.0, 1.0, 0.0, 1.0],    // Top face: green
      [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
      [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
      [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    let indices: number[] = [
      0, 1, 3, 1, 2, 3
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);
    return {
      position: positionBuffer,
      indices: indexBuffer,
    };
  }
  initMouseControl(inputTracker: InputTracker) {
    inputTracker.mouseMoving.subscribe(mov => this.rotateByMouse(mov));
  }
  rotateByMouse(mov) {
    let mat1 = mat4.create();
    let mat2 = mat4.create();
    let rotV = vec3.create();
    let _up = Planet.camera.Up;
    vec3.cross(rotV, Planet.camera.Up, Planet.camera.Forward);
    mat4.rotate(this.ModelMatrix, this.ModelMatrix, this.deltaTime * mov[0], _up);
    mat4.rotate(this.ModelMatrix, this.ModelMatrix, -this.deltaTime * mov[1], rotV);

    // let rotateQuat=quat.create();
    // quat.setAxisAngle(rotateQuat, _up,this.deltaTime * mov[0]);
    // let rotateMatrix=mat4.create();
    // mat4.fromQuat(rotateMatrix,rotateQuat);
    // mat4.multiply(this.ModelMatrix,this.ModelMatrix,rotateMatrix);

    // rotateQuat=quat.create();
    // quat.setAxisAngle(rotateQuat, rotV,this.deltaTime * mov[1]);
    // rotateMatrix=mat4.create();
    // mat4.fromQuat(rotateMatrix,rotateQuat);
    // mat4.multiply(this.ModelMatrix,this.ModelMatrix,rotateMatrix);
  }
}