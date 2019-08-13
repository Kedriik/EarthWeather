import { Component, OnInit } from '@angular/core';
import { webgl } from 'webgl';
import { mat4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';
import { vec2 } from 'gl-matrix';
import { Camera } from './Camera'
import { InputTracker } from './InputTracker'
import { Planet } from './Planet'
import { Star } from './Star'
import { GLHelpers } from './glhelpers'

let canvas: any;
declare var require: any
@Component({
  selector: 'app-renderer',
  providers: [
  ],
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.css']
})
export class RendererComponent implements OnInit {
  FragmenShader: string[]
  vsSource: string[] = [
    `#version 300 es
    in vec3 aVertexPosition;
    void main(void) {
      gl_Position   = vec4(aVertexPosition,1);
      gl_Position.z = 0.0;
    }`
  ];
  fsSource: string[] = [
    `#version 300 es
    void main(void) {
      discard;
    }`
  ];
  constructor() {

  }
  ;
  gl: webgl;
  CommonBuffers: any;
  DefferedShaderProgram: any;
  DefferedShaderProgramInfo: any;
  squareRotation: number = 0.0;
  then: number = 0.0;
  ViewMatrix: mat4;
  ProjectionMatrix: mat4;

  camera: Camera;
  inputTracker: InputTracker;
  rttFrameBuffer: any;
  AtmosphereLayerFrameBuffer: any;
  CloudsLayerFrameBuffer: any;
  rttTexture: any;
  NormalTexture: any;
  PositionTexture: any;
  ColorPropertiesTexture: any;
  ///Particles///
  ParticlesFramebufferFront: any;
  ParticlesFramebufferBack: any;
  ParticlesBuffer: any;
  ParticlesPositionsFront: any;    //z = particles life
  ParticlesPositionsBack: any;    //z = particles life
  ParticlesVelocities: any;   //
  ParticlesVelocitiesImage: any;
  ParticleDrawProgram: any;
  ParticleDrawProgramInfo: any;
  ParticleComputeProgram: any;
  ParticleComputeProgramInfo: any;
  particlesSize: number = 100;
  ParticleFrontBack: boolean = false;
  ///////////////
  DepthTexture: any;
  renderBuffer: any;
  screenSize: vec2;
  LightPosition: vec3;
  LightPower: number;
  LightColor: vec3;
  PlanetMars: Planet;
  planets: any;
  Sun: Star;
  MilkyWay: any;
  bPauseRendering = false;
  PlanetAndDists: number[][]
  camT: boolean = true
  PlanetSizeScale: number = 1;
  PlanetDistScale: number = 0.1;
  SunSizeScale: number = 0.01;
  testCoords: any;
  Earth: Planet;
  particlesStop:boolean = true;
  ngOnInit() {
    this.start();
    requestAnimationFrame(this.render.bind(this));
  }
  onResize(event) {
    canvas.width = (document.body.clientWidth);
    this.gl = this.initWebGL(canvas);
    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.initTextureFramebuffer();
    this.camera.init();
    this.screenSize[0] = canvas.clientWidth;
    this.screenSize[1] = canvas.clientHeight;
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100000.0;
    mat4.perspective(this.ProjectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);
  }
  start() {
    canvas = document.getElementById("glcanvas");
    canvas.tabIndex = 0;
    canvas.width = (document.body.clientWidth);
    this.gl = this.initWebGL(canvas);      // Initialize the GL context

    this.PlanetAndDists = []
    let tvec = vec3.create();
    this.planets = [];

    this.Sun = new Star;
    this.Sun.init(this.gl);
    this.Sun.Position = vec3.fromValues(149600, 0, 0);
    this.planets.push(this.Sun);

    this.Earth = new Planet;
    this.Earth.PlanetName = "Earth";
    this.Earth.init(this.gl);
    this.Earth.hasOceans = false;
    this.Earth.hasAtmosphere = true;
    this.Earth.hasClouds = true;
    this.Earth.Position = vec3.fromValues(0, 0, 0);
    this.Earth.RaymarchSteps = 64;
    this.planets.push(this.Earth)

    if (this.gl) {
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
      this.gl.enable(this.gl.DEPTH_TEST);                               // Enable depth testing
      this.gl.depthFunc(this.gl.LEQUAL);                                // Near things obscure far things
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.
      this.gl.disable(this.gl.CULL_FACE);
    }
    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.initTextureFramebuffer();
    this.initParticlesFramebuffer();



    this.DefferedShaderProgram = GLHelpers.initShaderProgram(
      this.gl, this.vsSource, require("raw-loader!./Shaders/DefferedFrag.shader"));
    this.DefferedShaderProgramInfo = {
      program: this.DefferedShaderProgram,
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(this.DefferedShaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        colorSampler: this.gl.getUniformLocation(this.DefferedShaderProgram, 'Color'),
        normalSampler: this.gl.getUniformLocation(this.DefferedShaderProgram, 'Normal'),
        positionSampler: this.gl.getUniformLocation(this.DefferedShaderProgram, 'Position'),
        colorPropertiesSampler: this.gl.getUniformLocation(this.DefferedShaderProgram, 'ColorProperties'),
        depthSampler: this.gl.getUniformLocation(this.DefferedShaderProgram, 'Depth'),
        lightPower: this.gl.getUniformLocation(this.DefferedShaderProgram, 'uLightPower'),
        lightPosition: this.gl.getUniformLocation(this.DefferedShaderProgram, 'uLightPosition'),
        lightColor: this.gl.getUniformLocation(this.DefferedShaderProgram, 'uLightColor'),
        screenSize: this.gl.getUniformLocation(this.DefferedShaderProgram, 'uScreenSize'),
        cameraPosition: this.gl.getUniformLocation(this.DefferedShaderProgram, 'uCameraPosition')
      },
    };
    this.CommonBuffers = this.initBuffers(this.gl);
    this.CommonBuffers.canvas = canvas;
    this.camera = new Camera();
    this.camera.init();
    for (let i = 0; i < this.planets.length; i++) {
      let array = []
      array.push(i);
      let dist: number;
      dist = vec3.dist(this.camera.Position, this.planets[i].Position);
      array.push(dist);
      this.PlanetAndDists.push(array);
    }

    canvas.width = (document.body.clientWidth);
    this.gl = this.initWebGL(canvas);
    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.initTextureFramebuffer();
    this.camera.init();
    this.screenSize = vec2.create();
    this.screenSize[0] = canvas.clientWidth;
    this.screenSize[1] = canvas.clientHeight;
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100000.0;
    this.ProjectionMatrix = mat4.create();
    this.ViewMatrix = mat4.create();
    mat4.perspective(this.ProjectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    this.inputTracker = new InputTracker();
    Planet.camera = this.camera;
    this.Earth.initMouseControl(this.inputTracker);
    this.inputTracker.init(canvas);
    this.LightPosition = this.Sun.Position;
    this.LightColor = this.Sun.Color;
    this.LightPower = this.Sun.Power;
    this.CommonBuffers.loopTotalTime = 0;
  }

  initWebGL(canvas) {
    this.gl = null;

    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      this.gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");
    }
    catch (e) { }

    // If we don't have a GL context, give up now
    if (!this.gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      this.gl = null;
    }

    return this.gl;
  }
  initParticlesFramebuffer() {
    this.gl.getExtension('EXT_color_buffer_float');
    //Front
    this.ParticlesFramebufferFront = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferFront);
    this.ParticlesFramebufferFront.width = this.particlesSize;
    this.ParticlesFramebufferFront.height = this.particlesSize;

    this.ParticlesPositionsFront = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsFront);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.ParticlesFramebufferFront.width,
      this.ParticlesFramebufferFront.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.ParticlesPositionsFront, 0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferFront);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    //BACK
    this.ParticlesFramebufferBack = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferBack);
    this.ParticlesFramebufferBack.width = this.particlesSize;
    this.ParticlesFramebufferBack.height = this.particlesSize;

    this.ParticlesPositionsBack = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsBack);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.ParticlesFramebufferBack.width,
      this.ParticlesFramebufferBack.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.ParticlesPositionsBack, 0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferBack);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    /////////////////
    this.ParticlesBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ParticlesBuffer);

    let indexes = []
    for (let i = 0; i < this.particlesSize; i++) {
      for (let j = 0; j < this.particlesSize; j++) {
        //initialPositions.push(Math.random() * 360, Math.random() * 180, 0);
        indexes.push(i);
        indexes.push(j);
      }
    }
    console.log("Idexes size:",indexes.length)
    this.gl.bufferData(this.gl.ARRAY_BUFFER,
      new Float32Array(indexes),
      this.gl.DYNAMIC_DRAW);

    this.ParticleComputeProgram = GLHelpers.initShaderProgram(
      this.gl, this.vsSource, require("raw-loader!./Shaders/ParticlesComputeFragment.shader"));
    this.ParticleComputeProgramInfo = {
      program: this.ParticleComputeProgram,
      attribLocations: {
        particlesIndexes: this.gl.getAttribLocation(this.ParticleComputeProgram, 'aVertexPosition')
      },
      uniformLocations: {
        time: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uTime'),
        deltaTime: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uDeltaTime'),
        particleLife: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uParticleLife'),
        particlesPositions: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uParticlesPositions'),
        windVectors: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uWindVectors'),
        particleCount: this.gl.getUniformLocation(this.ParticleComputeProgram, 'uParticleCount')
      },
    };

    this.ParticleDrawProgram = GLHelpers.initShaderProgram(
      this.gl, require("raw-loader!./Shaders/ParticlesVertex.shader"), require("raw-loader!./Shaders/ParticlesFragment.shader"));
    this.ParticleDrawProgramInfo = {
      program: this.ParticleDrawProgram,
      attribLocations: {
        particlesIndexes: this.gl.getAttribLocation(this.ParticleDrawProgram, 'aParticleIndex'),
      },
      uniformLocations: {
        particlesPositions: this.gl.getUniformLocation(this.ParticleDrawProgram, 'uParticlesPositions'),
        viewMatrix: this.gl.getUniformLocation(this.ParticleDrawProgram, 'uViewMatrix'),
        projectionMatrix: this.gl.getUniformLocation(this.ParticleDrawProgram, 'uProjectionMatrix')
      },
    };

    this.ParticlesVelocitiesImage = new Image();
    this.ParticlesVelocitiesImage.src = require('./Textures/dirswindsigma995.png');
    this.ParticlesVelocitiesImage.onload = () => {
      this.ParticlesVelocities = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesVelocities);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.ParticlesVelocitiesImage.width,
        this.ParticlesVelocitiesImage.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.ParticlesVelocitiesImage)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.particlesStop = false;
    }

    

  }
  updateAndDrawParticles(ProjectionMatrix, ViewMatrix, time, deltaTime) {
    //update
    if(this.particlesStop){
      return;
    }
    this.gl.useProgram(this.ParticleComputeProgramInfo.program);
    if(this.ParticleFrontBack){
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferFront);
      this.gl.viewport(0, 0, this.particlesSize, this.particlesSize);
      this.gl.disable(this.gl.DEPTH_TEST);
      
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsBack);
      this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.particlesPositions, 0);
    }else{
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferBack);
      this.gl.viewport(0, 0, this.particlesSize, this.particlesSize);
      this.gl.disable(this.gl.DEPTH_TEST);
      
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsFront);
      this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.particlesPositions, 0);
    }
    this.ParticleFrontBack = !this.ParticleFrontBack; //swap buffers

    
    const numComponents = 3;  // pull out 2 values per iteration
    const type = this.gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.CommonBuffers.position);

    this.gl.vertexAttribPointer(
      this.ParticleComputeProgramInfo.attribLocations.particlesIndexes,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    this.gl.enableVertexAttribArray(
      this.ParticleComputeProgramInfo.attribLocations.particlesIndexes);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.CommonBuffers.indices);

    this.gl.uniform1f(
      this.ParticleComputeProgramInfo.uniformLocations.time,
      time
    )

    this.gl.uniform1f(
      this.ParticleComputeProgramInfo.uniformLocations.deltaTime,
      deltaTime
    )
    this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.particleCount, this.particlesSize);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesVelocities);
    this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.windVectors, 1);
      
    {
      const vertexCount = 6;
      const type = this.gl.UNSIGNED_SHORT;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
    
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ParticlesBuffer);
    this.gl.viewport(0, 0, canvas.width,canvas.height);
    this.gl.vertexAttribPointer(
      this.ParticleDrawProgramInfo.attribLocations.particlesIndexes,
      2,
      type,
      normalize,
      stride,
      offset);
    this.gl.enableVertexAttribArray(
      this.ParticleDrawProgramInfo.attribLocations.particlesIndexes);
    this.gl.useProgram(this.ParticleDrawProgramInfo.program);
    this.gl.uniform1i(this.ParticleDrawProgramInfo.uniformLocations.particlesPositions, 0);
    this.gl.uniformMatrix4fv(
      this.ParticleDrawProgramInfo.uniformLocations.viewMatrix,
      false,
      ViewMatrix);
    this.gl.uniformMatrix4fv(
      this.ParticleDrawProgramInfo.uniformLocations.projectionMatrix,
      false,
      ProjectionMatrix);

    this.gl.drawArrays(this.gl.POINTS, 0, this.particlesSize * this.particlesSize)

  }

  initTextureFramebuffer() {
    this.gl.getExtension('EXT_color_buffer_float');
    this.rttFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFrameBuffer);
    this.rttFrameBuffer.width = canvas.width;
    this.rttFrameBuffer.height = canvas.height;

    this.rttTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.rttFrameBuffer.width,
      this.rttFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.NormalTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.NormalTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.rttFrameBuffer.width,
      this.rttFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.PositionTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.PositionTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.rttFrameBuffer.width,
      this.rttFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.ColorPropertiesTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ColorPropertiesTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.rttFrameBuffer.width,
      this.rttFrameBuffer.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.rttTexture, 0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1,
      this.gl.TEXTURE_2D, this.NormalTexture, 0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT2,
      this.gl.TEXTURE_2D, this.PositionTexture, 0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT3,
      this.gl.TEXTURE_2D, this.ColorPropertiesTexture, 0
    );

    this.renderBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT24,
      this.rttFrameBuffer.width, this.rttFrameBuffer.height
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER, this.renderBuffer
    );

    this.DepthTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.DepthTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24, this.rttFrameBuffer.width,
      this.rttFrameBuffer.height, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.DepthTexture, 0);
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1, this.gl.COLOR_ATTACHMENT2, this.gl.COLOR_ATTACHMENT3]);
    var status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);

    this.AtmosphereLayerFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.AtmosphereLayerFrameBuffer);
    this.AtmosphereLayerFrameBuffer.width = canvas.width;
    this.AtmosphereLayerFrameBuffer.height = canvas.height;

    Planet.AtmosphereLayerTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, Planet.AtmosphereLayerTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.AtmosphereLayerFrameBuffer.width,
      this.AtmosphereLayerFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.Sun.AtmosphereLayerTexture = Planet.AtmosphereLayerTexture;

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, Planet.AtmosphereLayerTexture, 0
    );

    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0])
    /////////////////
    this.CloudsLayerFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.CloudsLayerFrameBuffer);
    this.CloudsLayerFrameBuffer.width = canvas.width;
    this.CloudsLayerFrameBuffer.height = canvas.height;

    Planet.CloudsLayerTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, Planet.CloudsLayerTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.CloudsLayerFrameBuffer.width,
      this.CloudsLayerFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, Planet.CloudsLayerTexture, 0
    );
    //////////////////////
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0])

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  initBuffers(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Now create an array of positions for the square.
    const positions = [
      // Front face
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
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
    // Convert the array of colors into a table for all the vertices.
    var colors = [];
    for (var j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      // Repeat each color four times for the four vertices of the face
      colors = colors.concat(c, c, c, c);
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
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
      color: colorBuffer,
      indices: indexBuffer,
    };
  }
  animate(deltaTime) {

  }
  drawScene(gl, buffers, deltaTime) {
    if (this.bPauseRendering) {
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.clearDepth(1.0);                 // Clear everything
    gl.depthFunc(gl.LESS);            // Near things obscure far things
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    //camera handling
    if (vec3.dist(this.camera.Position, this.Earth.Position) < 10) {
      let tvec = vec3.create();
      vec3.sub(tvec, this.camera.Position, this.Earth.Position)
      vec3.normalize(tvec, tvec);
      let d = 10 - vec3.dist(this.camera.Position, this.Earth.Position);
      vec3.mul(tvec, tvec, [d, d, d]);
      this.camera.Position[0] += tvec[0]
      this.camera.Position[1] += tvec[1]
      this.camera.Position[2] += tvec[2]
    }
    this.ViewMatrix = this.camera.getViewMatrix();

    for (let index = 0; index < this.planets.length; index++) {

      let i = this.PlanetAndDists[index][0];
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFrameBuffer);
      gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);           // Enable depth testing
      gl.depthFunc(gl.LEQUAL);
      this.planets[i].animate(deltaTime, buffers);

      this.planets[i].draw(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);
      this.drawDeffered(gl, buffers);
      //gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFrameBuffer);
      // gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
      // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
      // gl.depthFunc(gl.LESS);            // Near things obscure far things
      // gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
      // if (this.planets[i].hasOceans) {
      //   this.planets[i].drawOcean(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);
      //   this.drawDeffered(gl, buffers);
      // }
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.AtmosphereLayerFrameBuffer);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT)
      //gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer)
      gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);;
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.disable(gl.DEPTH_TEST);
      if (this.planets[i].hasAtmosphere) {
        this.planets[i].drawDefferedAtmosphere(gl, buffers, this.ViewMatrix, this.ProjectionMatrix, this.DefferedShaderProgramInfo
          , this.LightPosition, this.LightColor, this.LightPower, this.camera, this.PositionTexture);
      }

      gl.cullFace(gl.BACK);

      if (this.planets[i].PlanetName == "Earth") {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFrameBuffer);
        gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LESS);            // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        this.planets[i].drawClassicClouds(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);
        this.drawDeffered(gl, buffers);
      }
      //particle final draw
     this.updateAndDrawParticles(this.ProjectionMatrix,this.ViewMatrix,this.CommonBuffers.loopTotalTime,deltaTime)

    }

    this.CommonBuffers.loopTotalTime += deltaTime;
  }
  drawDeffered(gl, buffers) {
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
        this.DefferedShaderProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.DefferedShaderProgramInfo.attribLocations.vertexPosition);
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(this.DefferedShaderProgramInfo.program);

    gl.uniform2f(
      this.DefferedShaderProgramInfo.uniformLocations.screenSize,
      canvas.clientWidth,
      canvas.clientHeight
    )

    gl.uniform3f(
      this.DefferedShaderProgramInfo.uniformLocations.lightPosition,
      this.LightPosition[0],
      this.LightPosition[1],
      this.LightPosition[2]
    );

    gl.uniform3f(
      this.DefferedShaderProgramInfo.uniformLocations.lightColor,
      this.LightColor[0],
      this.LightColor[1],
      this.LightColor[2]
    )
    gl.uniform1f(
      this.DefferedShaderProgramInfo.uniformLocations.lightPower,
      this.LightPower
    );

    gl.uniform3f(
      this.DefferedShaderProgramInfo.uniformLocations.cameraPosition,
      this.camera.Position[0],
      this.camera.Position[1],
      this.camera.Position[2]
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
    gl.uniform1i(this.DefferedShaderProgramInfo.uniformLocations.colorSampler, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.NormalTexture);
    gl.uniform1i(this.DefferedShaderProgramInfo.uniformLocations.normalSampler, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.PositionTexture);
    gl.uniform1i(this.DefferedShaderProgramInfo.uniformLocations.positionSampler, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.ColorPropertiesTexture);
    gl.uniform1i(this.DefferedShaderProgramInfo.uniformLocations.colorPropertiesSampler, 3);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.DepthTexture);
    gl.uniform1i(this.DefferedShaderProgramInfo.uniformLocations.depthSampler, 4);

    {
      const vertexCount = 6;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
    gl.disable(gl.BLEND);
  }

  /// ********* TODO: IMPROVE*********
  render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - this.then;
    this.then = now;
    let pressedKeys = this.inputTracker.getCurrentlyPressedKeys()
    this.camera.updateCameraKeyboard(deltaTime, pressedKeys);
    let origin: vec3
    origin = vec3.create()
    origin[2] = -26
    origin[1] = 0
    origin[0] = 0
    this.animate(deltaTime);
    this.drawScene(this.gl, this.CommonBuffers, deltaTime);
    requestAnimationFrame(this.render.bind(this));
  }

  getInputTracker() {
    return this.inputTracker;
  }
  pauseRendering() {
    this.bPauseRendering = true;
  }
  startRendering() {
    this.bPauseRendering = false;
    //this.inputTracker.init(canvas);
  }
}
