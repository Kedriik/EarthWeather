import {mat4} from 'gl-matrix';
import {vec4} from 'gl-matrix';
import {vec3} from 'gl-matrix';
import {quat} from 'gl-matrix';
import { InputTracker } from 'src/app/renderer/inputTracker'

export class Camera
{
  ViewMatrix: mat4;
  Position:vec3;
  Forward:vec3;
  Up:vec3;
  currentRenderer:any;
  rotateSpeed:number=2;
  translateSpeed:number=10;
  deltaTime:number;
  constructor(){

  }
  init(){
    this.ViewMatrix=mat4.create();
    this.Position=vec3.create();
    this.Position[0]= 0.0;
    this.Position[1] = -20.0;
    this.Position[2] = 0.0;
    this.Forward=vec3.create();
    this.Forward[0] = -1;
    this.Forward[2] = 0;
    this.Forward[1] = -2; 
    vec3.normalize(this.Forward,this.Forward)
    this.Up=vec3.create();
    this.Up[2]= -1;
  }

  setPosition(position)
  {
    this.Position=position;
  }
  setForward(forward){
    this.Forward=forward;
  }
  setUp(up){
    this.Up=up;
  }
  getViewMatrix(){
    const look_at=vec3.create();
    vec3.add(look_at,this.Position,this.Forward)
    mat4.lookAt(this.ViewMatrix,this.Position,look_at,this.Up);
    return this.ViewMatrix;
  }
  updateCameraKeyboardForwardRotate(deltaTime, pressedKeys){
   
    if(pressedKeys[87]==true)
    {
      let translateVector=vec3.create();
      vec3.copy(translateVector,this.Forward)
      vec3.scale(translateVector,translateVector,this.translateSpeed*deltaTime);
      vec3.add(this.Position, this.Position,translateVector);
      this.currentRenderer.clearParticles();
      
    }
    if(pressedKeys[83]==true)
    {
      let translateVector=vec3.create();
      vec3.copy(translateVector,this.Forward)
      vec3.scale(translateVector,translateVector,-this.translateSpeed*deltaTime);
      vec3.add(this.Position, this.Position,translateVector);
      this.currentRenderer.clearParticles();
    }

    if(pressedKeys[79]==true || pressedKeys[85]==true ){
      let angle:number;
      this.currentRenderer.clearParticles();
      if(pressedKeys[79]==true && pressedKeys[85]==true){
        angle=0;
      }
      else{
        if(pressedKeys[85]==true){
          angle=deltaTime*this.rotateSpeed;
        }
        else if(pressedKeys[79]==true){
          angle=-deltaTime*this.rotateSpeed;
        }
      }
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
    }

  }

  updateCameraKeyboard(deltaTime, pressedKeys){
    
      if(pressedKeys[87]==true)
      {
        let translateVector=vec3.create();
        vec3.copy(translateVector,this.Forward)
        vec3.scale(translateVector,translateVector,this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
        
      }
      if(pressedKeys[81]==true)
      {
        let translateVector=vec3.create();
        vec3.copy(translateVector,this.Up)
        vec3.scale(translateVector,translateVector,this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
        
      }
      if(pressedKeys[69]==true)
      {
        let translateVector=vec3.create();
        vec3.copy(translateVector,this.Up)
        vec3.scale(translateVector,translateVector,-this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
        
      }
      if(pressedKeys[83]==true)
      {
        let translateVector=vec3.create();
        vec3.copy(translateVector,this.Forward)
        vec3.scale(translateVector,translateVector,-this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
        
      }
      if(pressedKeys[65]==true) //A
      { 
        let right=vec3.create();
        vec3.cross(right, this.Forward, this.Up);
        vec3.normalize(right,right);
        let translateVector=vec3.create();
        vec3.copy(translateVector,right)
        vec3.scale(translateVector,translateVector,-this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
        
      }

      if(pressedKeys[68]==true) //D
      { 
        let right=vec3.create();
        vec3.cross(right, this.Forward, this.Up);
        vec3.normalize(right,right);
        let translateVector=vec3.create();
        vec3.copy(translateVector,right)
        vec3.scale(translateVector,translateVector,this.translateSpeed*deltaTime);
        vec3.add(this.Position, this.Position,translateVector);
      }

      if(pressedKeys[79]==true || pressedKeys[85]==true ){
        let angle:number;
        
        if(pressedKeys[79]==true && pressedKeys[85]==true){
          angle=0;
        }
        else{
          if(pressedKeys[85]==true){
            angle=deltaTime*this.rotateSpeed;
          }
          else if(pressedKeys[79]==true){
            angle=-deltaTime*this.rotateSpeed;
          }
        }
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
        
      }

      if(pressedKeys[74]==true || pressedKeys[76]==true ){
        let angle:number;
        
        if(pressedKeys[74]==true && pressedKeys[76]==true){
          angle=0;
        }
        else{
          if(pressedKeys[76]==true){
            angle=-deltaTime*this.rotateSpeed;
          }
          else if(pressedKeys[74]==true){
            angle=deltaTime*this.rotateSpeed;
          }
        }
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
        
      }

      if(pressedKeys[73]==true || pressedKeys[75]==true ){
        let angle:number;
        
        if(pressedKeys[73]==true && pressedKeys[75]==true){
          angle=0;
        }
        else{
          if(pressedKeys[73]==true){
            angle=-deltaTime*this.rotateSpeed;
          }
          else if(pressedKeys[75]==true){
            angle=deltaTime*this.rotateSpeed;
          }
        }
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
      
      }
  }
  updateCameraRotate(origin:vec3,deltaTime){
    let vt:vec3
    vt = vec3.create()
    let dist:number
    vec3.subtract(vt,origin,this.Position);
    dist = vec3.length(vt)
    //vec3.normalize(vt,vt)

    let rotateAroundVector=vec3.create();
      
    this.Position = origin
    vec3.copy(rotateAroundVector,this.Up);
    let rotateSpeed:number
    rotateSpeed = 0.1
    let rotateQuat=quat.create();
    quat.setAxisAngle(rotateQuat, rotateAroundVector,deltaTime*rotateSpeed);
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

    vt[0] = this.Forward[0]*-dist
    vt[1] = this.Forward[1]*-dist
    vt[2] = this.Forward[2]*-dist
    this.Position = vec3.add(this.Position,this.Position,vt)
  }
  initMouseControl(inputTracker: InputTracker) {
    inputTracker.mouseMoving1.subscribe(mov => this.rotateByMouse(mov));
  }
  rotateByMouse(mov) {
    for(let i =0;i<2;i++){
      let origin = vec3.create();
      let vt:vec3
      vt = vec3.create()
      let dist:number
      vec3.subtract(vt,origin,this.Position);
      dist = vec3.length(vt)

      let rotateAroundVector=vec3.create();
        
      this.Position = origin
      if(i==0){
        vec3.copy(rotateAroundVector,this.Up);
      }
      else if (i==1){
        let rotV = vec3.create();
        vec3.cross(rotV, this.Forward,this.Up);
        vec3.copy(rotateAroundVector,rotV);
      }
      let rotateSpeed:number
      rotateSpeed = 0.1
      let rotateQuat=quat.create();
      quat.setAxisAngle(rotateQuat, rotateAroundVector,rotateSpeed*rotateSpeed*mov[i]);
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

      vt[0] = this.Forward[0]*-dist
      vt[1] = this.Forward[1]*-dist
      vt[2] = this.Forward[2]*-dist
      this.Position = vec3.add(this.Position,this.Position,vt)
  }
  }
}