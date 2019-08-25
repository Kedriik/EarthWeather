import { Component, OnInit, ViewChild } from '@angular/core';
import { webgl } from 'webgl';
import { mat4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';
import { vec2 } from 'gl-matrix';
import { Camera } from './Camera'
import { InputTracker } from './InputTracker'
import { Planet } from './Planet'
import { Star } from './Star'
import { GLHelpers } from './glhelpers'
import { HttpClient } from '@angular/common/http';

let canvas: any;
let menu: any;
declare var require: any
@Component({
  selector: 'app-renderer',
  providers: [
  ],
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.css']
})
export class RendererComponent implements OnInit {
  @ViewChild('renderer') renderer: any;

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
  constructor(private http:HttpClient) {

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
  CopyProgram: any;
  CopyProgramInfo: any;
  ParticlesFramebufferFront: any;
  ParticlesFramebufferBack: any;
  ParticlesCopyFramebuffer: any;
  ParticlesFinalFrameBufferFront: any;
  ParticlesFinalFrameBuffer: any
  ParticleDrawFinalProgram: any;
  ParticleDrawFinalProgramInfo: any;
  ParticlesFinalTexture: any;
  ParticlesBuffer: any;
  ParticlesPositionsFront: any;    //z = particles life
  ParticlesPositionsBack: any;    //z = particles life
  ParticlesFinalTextureFront: any;
  ParticlesFinalTextureBack: any;
  ParticlesVelocities: any;   //
  ParticlesVelocitiesImage: any;
  ParticleDrawProgram: any;
  ParticleDrawProgramInfo: any;
  ParticleComputeProgram: any;
  ParticleComputeProgramInfo: any;
  ParticlesSpeedsImage: any;
  ParticlesSpeeds: any;
  particlesSize: number = 400;
  currentParticlesSize: number = 10;
  ParticleFrontBack: boolean = false;
  DebugOutput: any;
  ParticleTextureWidth = 4096;//1300;
  ParticleTextureHeight = 2048;//650;
  //ParticleTextureWidth 
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
  cloudsButtonName = "wind particles";
  atmosphereButtonName = "atmosphere:on";
  topologyButtonName = "topology:on";
  renderCloudsButtonName = "clouds:on";
  particlesStop: boolean = true;
  renderAtmosphere: boolean = true;
  renderTopology: boolean = true;
  renderClouds: boolean = true;
  mainMessage: string;
  bDesktop = false;
  bChecking = true;
  bRender = true;
  fpsCounter: number = 0;
  countingTime: number = 0;
  bStartCouting = 0;
  bFirstTry=true;
  particleFramesOffset = 0;
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async printDelayed() {
    while (true) {
      this.mainMessage += ".";
      if (!this.bChecking) {
        break;
      }
      await this.delay(1000);
    }

    this.mainMessage += "\n";
  }

  ngOnInit() {
    localStorage.clear();
    var ua = navigator.userAgent;
    this.mainMessage = "Detecting hardware."
    this.printDelayed();
    //await this.delay(1000);
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
      this.mainMessage += "Mobile detected.\nThis application uses Raymarching to render detailed Earth topography.\nPlease use modern desktop machine.\n";
      this.bChecking = false;
      this.bDesktop = false;
      this.bRender = false;
    }

    else {
      this.bDesktop = true;
      this.mainMessage += "Desktop detected.\n";
      this.start();
      requestAnimationFrame(this.render.bind(this));


    }


  }
  onResize(event) {

    this.gl = this.initWebGL(canvas);
    canvas.width = document.body.clientWidth;
    canvas.height = 0.9 * document.body.clientHeight;// - menu.offsetHeight;
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
    this.mainMessage += "Loading textures.";
    canvas = document.getElementById("glcanvas");
    menu = document.getElementById("bottomPanel");
    canvas.tabIndex = 0;
    this.gl = this.initWebGL(canvas);      // Initialize the GL context

    canvas.width = document.body.clientWidth;
    canvas.height = 0.9 * document.body.clientHeight;// - menu.offsetHeight;

    this.PlanetAndDists = []
    let tvec = vec3.create();
    this.planets = [];

    this.Sun = new Star;
    this.Sun.init(this.gl);
    this.Sun.Position = vec3.fromValues(149600, 0, 0);
    this.planets.push(this.Sun);

    this.Earth = new Planet;
    Planet.MyCurrentRenderer = this;
    this.Earth.PlanetName = "Earth";
    this.Earth.init(this.gl);
    this.Earth.hasOceans = false;
    this.Earth.hasAtmosphere = true;
    this.Earth.hasClouds = true;
    this.Earth.Position = vec3.fromValues(0, 0, 0);
    this.Earth.RaymarchSteps = 32;
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

    this.DebugOutput = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.DebugOutput);
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
    //BACK positions
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
    ////Final particle result texture front
    this.ParticlesFinalFrameBufferFront = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBufferFront);
    this.ParticlesFinalFrameBufferFront.width = this.ParticleTextureWidth;
    this.ParticlesFinalFrameBufferFront.height = this.ParticleTextureHeight;

    this.ParticlesFinalTextureFront = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTextureFront);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.ParticlesFinalFrameBufferFront.width,
      this.ParticlesFinalFrameBufferFront.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.ParticlesFinalTextureFront, 0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBufferFront);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.ParticlesFinalTextureBack = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTextureBack);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.ParticlesFinalFrameBufferFront.width,
      this.ParticlesFinalFrameBufferFront.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    ////Final
    this.ParticlesFinalFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBuffer);
    this.ParticlesFinalFrameBuffer.width = this.ParticleTextureWidth;
    this.ParticlesFinalFrameBuffer.height = this.ParticleTextureHeight;

    this.ParticlesFinalTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.ParticlesFinalFrameBuffer.width,
      this.ParticlesFinalFrameBuffer.height, 0, this.gl.RGBA, this.gl.FLOAT, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.ParticlesFinalTexture, 0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBuffer);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    ///Copy
    this.ParticlesCopyFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesCopyFramebuffer);
    this.ParticlesCopyFramebuffer.width = this.ParticleTextureWidth;
    this.ParticlesCopyFramebuffer.height = this.ParticleTextureHeight;

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.ParticlesFinalTextureBack, 0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesCopyFramebuffer);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    //////////////
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
        projectionMatrix: this.gl.getUniformLocation(this.ParticleDrawProgram, 'uProjectionMatrix'),
        screenSize: this.gl.getUniformLocation(this.ParticleDrawProgram, 'uScreenSize')
      },
    };

    this.ParticleDrawFinalProgram = GLHelpers.initShaderProgram(
      this.gl, this.vsSource, require("raw-loader!./Shaders/ParticlesFinalFragment.shader"));
    this.ParticleDrawFinalProgramInfo = {
      program: this.ParticleDrawFinalProgram,
      attribLocations: {
        particlesIndexes: this.gl.getAttribLocation(this.ParticleDrawFinalProgram, 'aVertexPosition')
      },
      uniformLocations: {
        screenSize: this.gl.getUniformLocation(this.ParticleDrawFinalProgram, 'uScreenSize'),
        front: this.gl.getUniformLocation(this.ParticleDrawFinalProgram, 'uFront'),
        back: this.gl.getUniformLocation(this.ParticleDrawFinalProgram, 'uBack')
      },
    };

    this.CopyProgram = GLHelpers.initShaderProgram(
      this.gl, this.vsSource, require("raw-loader!./Shaders/ParticlesCopyFragment.shader"));
    this.CopyProgramInfo = {
      program: this.CopyProgram,
      attribLocations: {
        particlesIndexes: this.gl.getAttribLocation(this.CopyProgram, 'aVertexPosition')
      },
      uniformLocations: {
        screenSize: this.gl.getUniformLocation(this.CopyProgram, 'uScreenSize'),
        final: this.gl.getUniformLocation(this.CopyProgram, 'uFinal')
      },
    };

    this.ParticlesVelocitiesImage = new Image();
    this.ParticlesVelocitiesImage.src = require('./Textures/dirswindsigma995.jpg');
    this.ParticlesVelocitiesImage.onload = () => {
      this.ParticlesVelocities = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesVelocities);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.ParticlesVelocitiesImage.width,
        this.ParticlesVelocitiesImage.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.ParticlesVelocitiesImage)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.particlesStop = false;
    }

    this.ParticlesSpeedsImage = new Image();
    this.ParticlesSpeedsImage.src = require('./Textures/speedwindsigma995.jpg');
    this.ParticlesSpeedsImage.onload = () => {
      this.ParticlesSpeeds = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesSpeeds);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.ParticlesSpeedsImage.width,
        this.ParticlesSpeedsImage.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.ParticlesSpeedsImage)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    }



  }
  computeParticles(time, deltaTime) {

    const numComponents = 3;  // pull out 2 values per iteration
    const type = this.gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    const offset = 0;         // how many bytes inside the buffer to start from

    this.gl.useProgram(this.ParticleComputeProgramInfo.program);
    if (this.ParticleFrontBack) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferFront);
      this.gl.viewport(0, 0, this.particlesSize, this.particlesSize);
      this.gl.disable(this.gl.DEPTH_TEST);

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsBack);
      this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.particlesPositions, 0);
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFramebufferBack);
      this.gl.viewport(0, 0, this.particlesSize, this.particlesSize);
      this.gl.disable(this.gl.DEPTH_TEST);

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesPositionsFront);
      this.gl.uniform1i(this.ParticleComputeProgramInfo.uniformLocations.particlesPositions, 0);
    }
    //this.ParticleFrontBack = !this.ParticleFrontBack; //swap buffers



    // 0 = use type and numComponents above

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
  }
  updateAndDrawParticles(ProjectionMatrix, ViewMatrix, time, deltaTime) {
    this.particleFramesOffset+=1;
    if (this.particlesStop || !this.renderClouds || this.particleFramesOffset%3 != 0) {
      return;
    }

    const numComponents = 3;  // pull out 2 values per iteration
    const type = this.gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    const offset = 0;         // how many bytes inside the buffer to start from

    this.gl.useProgram(this.CopyProgramInfo.program);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesCopyFramebuffer);
    this.gl.viewport(0, 0, this.ParticleTextureWidth, this.ParticleTextureHeight);
    this.gl.activeTexture(this.gl.TEXTURE5);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTexture);
    this.gl.uniform1i(this.CopyProgramInfo.uniformLocations.final, 5);

    this.gl.uniform2f(
      this.CopyProgramInfo.uniformLocations.screenSize,
      this.ParticleTextureWidth,
      this.ParticleTextureHeight
    )

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.CommonBuffers.position);

    this.gl.vertexAttribPointer(
      this.CopyProgramInfo.attribLocations.particlesIndexes,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    this.gl.enableVertexAttribArray(
      this.CopyProgramInfo.attribLocations.particlesIndexes);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.CommonBuffers.indices);

    {
      const vertexCount = 6;
      const type = this.gl.UNSIGNED_SHORT;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }

    this.computeParticles(time, deltaTime);
    ///////// DRAW front
    this.gl.useProgram(this.ParticleDrawProgramInfo.program);
    this.gl.uniform2f(
      this.ParticleDrawProgramInfo.uniformLocations.screenSize,
      this.ParticleTextureWidth,
      this.ParticleTextureHeight
    )
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBufferFront);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ParticlesBuffer);
    this.gl.viewport(0, 0, this.ParticleTextureWidth, this.ParticleTextureHeight);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.vertexAttribPointer(
      this.ParticleDrawProgramInfo.attribLocations.particlesIndexes,
      2,
      type,
      normalize,
      stride,
      offset);
    this.gl.enableVertexAttribArray(
      this.ParticleDrawProgramInfo.attribLocations.particlesIndexes);
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
    ////////////////////////////////////////////////////
    this.gl.useProgram(this.ParticleDrawFinalProgramInfo.program);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ParticlesFinalFrameBuffer);
    this.gl.viewport(0, 0, this.ParticleTextureWidth, this.ParticleTextureHeight);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTextureFront);
    this.gl.uniform1i(this.ParticleDrawFinalProgramInfo.uniformLocations.front, 3);

    this.gl.uniform2f(
      this.ParticleDrawFinalProgramInfo.uniformLocations.screenSize,
      this.ParticleTextureWidth,
      this.ParticleTextureHeight
    )

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.CommonBuffers.position);

    this.gl.vertexAttribPointer(
      this.ParticleDrawFinalProgramInfo.attribLocations.particlesIndexes,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    this.gl.enableVertexAttribArray(
      this.ParticleDrawFinalProgramInfo.attribLocations.particlesIndexes);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.CommonBuffers.indices);

    {
      const vertexCount = 6;
      const type = this.gl.UNSIGNED_SHORT;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
    ////////
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesFinalTextureBack);
    this.gl.uniform1i(this.ParticleDrawFinalProgramInfo.uniformLocations.front, 3);

    {
      const vertexCount = 6;
      const type = this.gl.UNSIGNED_SHORT;
      const offset = 0;
      this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }

    this.ParticleFrontBack = !this.ParticleFrontBack; //swap buffers
  }
  initTextureFramebuffer() {
    this.gl.getExtension('EXT_color_buffer_float');
    this.rttFrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFrameBuffer);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
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

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.disable(this.gl.DEPTH_TEST);

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.AtmosphereLayerFrameBuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.DEPTH_TEST);
    this.Earth.markFootprint(gl,this.ViewMatrix,this.ProjectionMatrix);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFrameBuffer);
    gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.Sun.draw(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);



    this.Earth.animate(deltaTime, buffers);
    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.Earth.draw(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);
    this.drawDeffered(gl, buffers);


    if (this.renderAtmosphere) {
      this.Earth.drawDefferedAtmosphere(gl, buffers, this.ViewMatrix, this.ProjectionMatrix, this.DefferedShaderProgramInfo
        , this.LightPosition, this.LightColor, this.LightPower, this.camera, this.PositionTexture);
    }

    gl.cullFace(gl.BACK);

    if (this.renderClouds) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFrameBuffer);
      gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
      gl.enable(gl.DEPTH_TEST);           // Enable depth testing
      gl.depthFunc(gl.LESS);            // Near things obscure far things
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
      if (!this.particlesStop) {
        this.Earth.drawClassicClouds(gl, this.ViewMatrix, this.ProjectionMatrix, buffers, this.ParticlesFinalTexture);
      }
      else {
        this.Earth.drawClassicClouds(gl, this.ViewMatrix, this.ProjectionMatrix, buffers);
      }
      this.drawDeffered(gl, buffers);
    }
    //particle final draw
    this.updateAndDrawParticles(this.ProjectionMatrix, this.ViewMatrix, this.CommonBuffers.loopTotalTime, deltaTime)

    this.CommonBuffers.loopTotalTime += deltaTime;
  }
  drawDeffered(gl, buffers) {
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(
      this.DefferedShaderProgramInfo.attribLocations.vertexPosition,
      3,
      gl.FLOAT,
      false,
      0,
      0);
    gl.enableVertexAttribArray(
      this.DefferedShaderProgramInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

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

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.disable(gl.BLEND);
  }


  /// ********* TODO: IMPROVE*********
  render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - this.then;
    if (this.bStartCouting == 3) {
      this.mainMessage += "Textures loaded.\nTesting performance.";
      this.bStartCouting+=1;
    }
    if (this.bStartCouting > 3) {

      this.countingTime += deltaTime;
      this.fpsCounter += 1;
      if (this.countingTime > 10) {
        if (this.fpsCounter / this.countingTime > 15) {
          this.bChecking = false;
          this.mainMessage += "Fps is:"+ (this.fpsCounter / this.countingTime).toFixed(2);
          this.mainMessage += "\nUse W,S,A,D,Q and E to translate camera.\nUse I,J,K,L,U and O to rotate camera.\nClick left mouse button and move mouse to rotate Earth model.";
          this.mainMessage += "\nLast weather maps update: ";
          this.http.get('./assets/lastMapsUpdate.txt').subscribe(data => {
            this.mainMessage+=data['date'];
        })
          //this.mainMessage +=   require("./assets/lastMapsUpdate.txt");
          this.bStartCouting = 0;
        }
        else if(this.bFirstTry){
          this.mainMessage += "\nNot enough performance.Turning off features.";
          this.countingTime = 0;
          this.fpsCounter = 0;
          this.bFirstTry = false;
          this.renderCloudsMode();
          this.atmosphereMode();
          this.cloudsMode();
          this.mainMessage += "\nTesting performance again.";
        }
        else {
          this.bChecking = false;
          this.bRender = false;

          this.mainMessage += "\nYour hardware did not hold required FPS (" + (this.fpsCounter / this.countingTime).toFixed(2) + ")."
          this.mainMessage += "\nThis application uses Raymarching to render detailed Earth topography.\nPlease use modern desktop machine.";
          this.mainMessage += "\nRendering aborted";
          this.bRender = false;
        }
      }
    }
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
    if (this.bRender) {
      requestAnimationFrame(this.render.bind(this));
    }

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

  cloudsMode() {
    this.particlesStop = !this.particlesStop;
    if (!this.particlesStop) {
      this.cloudsButtonName = "wind particles"
    }
    else {
      this.cloudsButtonName = "clouds"
    }
    this.bPauseRendering = false;
  }
  atmosphereMode() {
    this.renderAtmosphere = !this.renderAtmosphere;
    if (this.renderAtmosphere) {
      this.atmosphereButtonName = "atmosphere:on";
    }
    else {
      this.atmosphereButtonName = "atmosphere:off";
    }
    this.bPauseRendering = false;
  }

  topologyMode() {
    this.renderTopology = !this.renderTopology;
    if (this.renderTopology) {
      this.topologyButtonName = "topology:on";
    }
    else {
      this.topologyButtonName = "topology:off";
    }
    this.bPauseRendering = false;
  }
  renderCloudsMode() {
    this.renderClouds = !this.renderClouds;
    if (this.renderClouds) {
      this.renderCloudsButtonName = "clouds:on";
    }
    else {
      this.renderCloudsButtonName = "clouds:off";
    }
    this.bPauseRendering = false;
  }
}
