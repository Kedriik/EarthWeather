import {EventEmitter,Output} from '@angular/core'
export class InputTracker{
    currentlyPressedKeys: Boolean[];
    filter:number;
    lmbPressed:boolean=false;
    lastPosX:number = -1;
    lastPosY:number = -1;
    @Output() mouseMoving = new EventEmitter<any>();
    init(canvas){
      document.onkeydown = this.handleKeyDown.bind(this);
      document.onkeyup = this.handleKeyUp.bind(this);
      canvas.onmousedown = this.handleMouseDown.bind(this);
      document.onmouseup = this.handleMouseUp.bind(this);
      document.onmousemove = this.handleMouseMove.bind(this);
      this.currentlyPressedKeys = new Array();
    }
    getCurrentlyPressedKeys(){
      return this.currentlyPressedKeys;
    }
    handleKeyDown(event) {
      this.currentlyPressedKeys[event.keyCode] = true;
    }
  
    handleKeyUp(event) {
      this.currentlyPressedKeys[event.keyCode] = false;
    }
  
    handleMouseDown(event){
      if(event.target.id  === "glcanvas" && event.buttons===1){
        this.lmbPressed = true;
      }
    }
    handleMouseUp(event){
        this.lmbPressed = false;
        this.lastPosX = -1;
        this.lastPosY = -1;
    }
    handleMouseMove(event){
      if(this.lmbPressed){
        let diffX = this.lastPosX - event.clientX;
        let diffY = this.lastPosY - event.clientY;
        if(this.lastPosX != -1 && this.lastPosY != -1){
          this.mouseMoving.emit([diffX, diffY])
        }
        this.lastPosX = event.clientX;
        this.lastPosY = event.clientY;
      }
    }
  }