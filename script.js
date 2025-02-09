const reset=document.getElementById("new1");
reset.addEventListener("click", function() {
    newGame(); 
});

const newG=document.getElementById("new2");
newG.addEventListener("click",function(){
    newGame();
    angle1DOM.innerText=0;
    angle2DOM.innerText=0;
    velocity1DOM.innerText=0;
    velocity2DOM.innerText=0;
    points1DOM.innerText=0;
    points2DOM.innerText=0;
});

let state={};
let isDragging = false;
let dragStartX = undefined;
let dragStartY = undefined;
const blastHoleRadius = 18;

const canvas=document.getElementById("game");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const ctx=canvas.getContext("2d");

//left info panel
const info1DOM = document.getElementById("info-left");
const angle1DOM=info1DOM.querySelector('.angle');
const velocity1DOM=info1DOM.querySelector('.velocity');
const points1DOM=info1DOM.querySelector('.points');

//right info panel
const info2DOM = document.getElementById("info-right");
const angle2DOM=info2DOM.querySelector('.angle');
const velocity2DOM=info2DOM.querySelector('.velocity');
const points2DOM=info2DOM.querySelector('.points');

//bomb-grab-area
const bombGrabAreaDOM=document.getElementById("bomb-grab-area");
//wind speed
const windSpeedDOM=document.getElementById("wind-speed");

newGame();

function newGame(){
    //reset game state
    state={
        phase:"aiming",
        currentPlayer:1,
        bomb:{
            x:undefined,
            y:undefined,
            rotation:0,
            velocity:{x:0,y:0}
        },
        windSpeed:generateWindSpeed(),
        //buildings
        backgroundBuildings:[],
        buildings:[],
        blastHoles:[],
        
        scale:1,
    };   
    
    //generate background buildings
    for(let i=0; i<11; i++){
        generateBackgroundBuildings(i);
    }

    // generate buildings
    for(let i=0; i<8; i++){
        generateBuildings(i);
    }

    calculateScale();

    initializeBombPosition();
    
    draw();
}

function generateBackgroundBuildings(i){
    const previousbuilding=state.backgroundBuildings[i-1];

    const x= previousbuilding ? previousbuilding.x + previousbuilding.width + 4: -30;

    const minWidth=80;
    const maxWidth=130;

    const width = minWidth + Math.random()*(maxWidth-minWidth);


    const minHeight=120;
    const maxHeight=420;

    const height= minHeight + Math.random()*(maxHeight-minHeight);

    state.backgroundBuildings.push({x,width,height});
}

function generateBuildings(i){
    const previousbuilding=state.buildings[i-1];

    const x= previousbuilding ? previousbuilding.x + previousbuilding.width + 4: 170;

    const minWidth=80;
    const maxWidth=130;
    const width = minWidth + Math.random()*(maxWidth-minWidth);

    const platformWithGorilla=i===1||i===6;
 

    const minHeight=80;
    const maxHeight=350;
    const minHeightGorilla=50;
    const maxHeightGorilla=100;
    
    const height= platformWithGorilla? minHeightGorilla+Math.random()*(maxHeightGorilla-minHeightGorilla)
    : minHeight+Math.random()*(maxHeight-minHeight);

    const lightsOn=[];
    for(let i=0; i<50; i++){
        const light=Math.random()<=0.33? true:false;
        lightsOn.push(light);
    }

    state.buildings.push({x,width,height,lightsOn});
}

function initializeBombPosition(){
    const building= 
    state.currentPlayer===1 ? state.buildings.at(1):state.buildings.at(-2);
    
    const gorillaX=building.x+building.width/2;
    const gorillaY=building.height;

    const gorillaHandOffSetX=state.currentPlayer===1? -28:28;
    const gorillaHandOffSetY=107;

    state.bomb.x=gorillaX+gorillaHandOffSetX;
    state.bomb.y=gorillaY+gorillaHandOffSetY;
    state.bomb.velocity.x=0;
    state.bomb.velocity.y=0;
    state.bomb.rotation=0;

    //initialize the position of bomb grab area
    const grabAreaRadius=15;
    const left=state.bomb.x*state.scale-grabAreaRadius;
    const bottom=state.bomb.y*state.scale-grabAreaRadius;
    bombGrabAreaDOM.style.left=`${left}px`;
    bombGrabAreaDOM.style.bottom=`${bottom}px`;

    windSpeedDOM.innerText=state.windSpeed;
}

function draw(){
    ctx.save();

    //flip coordinate system upside down
    ctx.translate(0,window.innerHeight);
    ctx.scale(1,-1);
    ctx.scale(state.scale,state.scale);
    //draw scene
    drawBackground();
    drawBackgroundBuildings();
    drawBuildingsWithBlastHoles();
    drawGorilla(1);
    drawGorilla(2);
    drawBomb();


    //restore transformation
    ctx.restore();

};

function drawBackground(){
    const gradient=ctx.createLinearGradient(0,0,0,window.innerHeight/state.scale);
    gradient.addColorStop(1,"rgba(248,186,133,1)");
    gradient.addColorStop(0,"rgba(248,186,133,1)");

    //draw sky
    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,window.innerWidth/state.scale,window.innerHeight/state.scale);

    //draw moon
    ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(400,470,50,0,2*Math.PI);
    ctx.fill();

};

function drawBackgroundBuildings(){
    state.backgroundBuildings.forEach((building) => {
        ctx.fillStyle= "rgba(160,32,240,0.6)";
        ctx.fillRect(building.x,0,building.width,building.height);
    });
}

function drawBuildingsWithBlastHoles() {
    ctx.save();
  
    state.blastHoles.forEach((blastHole) => {
      ctx.beginPath();
      ctx.rect(0,0,window.innerWidth/state.scale,window.innerHeight/state.scale);
      ctx.arc(blastHole.x, blastHole.y, blastHoleRadius, 0, 2 * Math.PI, true);
      ctx.clip();
    });
  
    drawBuildings();
    ctx.restore();
}

function drawBuildings(){
    state.buildings.forEach((building) => {
        ctx.fillStyle= "rgba(160,56,256,1)";
        ctx.fillRect(building.x,0,building.width,building.height);
    

    //draw windows
    const windowWidth=10;
    const windowHeight=12;
    const gap=15;

    const noOfFloors=Math.ceil((building.height-gap)/(windowHeight+gap));
    const noOfRoomsPerFloor=Math.floor((building.width-gap)/(windowWidth+gap));

    for(let i=0; i<noOfFloors; i++){
    for(let j=0; j<noOfRoomsPerFloor; j++){
        if (building.lightsOn[i*noOfRoomsPerFloor+j]){
            ctx.save();

            ctx.translate(building.x+gap,building.height-gap);
            ctx.scale(1,-1);

            const x=j*(windowWidth+gap);
            const y=i*(windowHeight+gap);

            ctx.fillStyle="rgba(250,250,250,0.6)";
            ctx.fillRect(x,y,windowWidth,windowHeight);

            ctx.restore();
        }
    }
    }
}
);
}

function drawGorilla(player){
    ctx.save();

    const building=player===1 ? state.buildings.at(1):state.buildings.at(-2);

    ctx.translate(building.x+building.width/2,building.height);

    drawGorillaBody();
    drawGorillaLeftArm(player);
    drawGorillaRightArm(player);
    drawGorillaFace(player);

    ctx.restore();
}

function drawGorillaBody() {
    ctx.fillStyle = "rgba(0,0,0,1)";
    
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-17, 18);
    ctx.lineTo(-20, 44);
  
    ctx.lineTo(-12, 78);
    ctx.lineTo(0, 84);
    ctx.lineTo(11, 77);
  
    ctx.lineTo(20, 44);
    ctx.lineTo(17, 18);
    ctx.lineTo(20, 0);
    ctx.lineTo(7, 0);
    ctx.fill();
  }

function drawGorillaLeftArm(player){
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth=18;

    ctx.beginPath();
    ctx.moveTo(-14,50);
    
    if(state.phase==="aiming" && state.currentPlayer===1 && player===1){
        ctx.quadraticCurveTo(-44,63,-28- state.bomb.velocity.x / 6.25 ,107- state.bomb.velocity.y / 6.25 );
      } else if(state.phase==="celebrating" && state.currentPlayer===player){
        ctx.quadraticCurveTo(-44, 63, -28, 107);
      } else{
        ctx.quadraticCurveTo(-44, 45, -28, 12);
      }
    ctx.stroke();
    
  }

function drawGorillaRightArm(player){
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth=18;

    ctx.beginPath();
    ctx.moveTo(14,50);
    
    if (state.phase==="aiming" && state.currentPlayer===2 && player===2) {
        ctx.quadraticCurveTo(44,63,28- state.bomb.velocity.x / 6.25,107- state.bomb.velocity.y / 6.25);
      }else if (state.phase==="celebrating" && state.currentPlayer===player) {
        ctx.quadraticCurveTo(+44, 63, +28, 107);
      }else {
        ctx.quadraticCurveTo(+44, 45, +28, 12);
      }
    ctx.stroke();
  }

function drawGorillaFace(player){
    ctx.fillStyle= "rgba(169, 169, 169, 1)";
    
    ctx.beginPath();
    ctx.arc(0,63,9,0,2*Math.PI);
    ctx.moveTo(-3.5,70);
    ctx.arc(-3.5,70,4,0,2*Math.PI);
    ctx.moveTo(+3.5, 70);
    ctx.arc(+3.5,70,4,0,2*Math.PI);
    ctx.fill();

    // eyes
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(-3.5,70,1.4,0,2*Math.PI);
    ctx.moveTo(+3.5, 70);
    ctx.arc(+3.5,70,1.4,0,2*Math.PI);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 1.4;

    // nose
    ctx.beginPath();
    ctx.moveTo(-3.5,66.5);
    ctx.lineTo(-1.5,65);
    ctx.moveTo(3.5,66.5);
    ctx.lineTo(1.5,65);
    ctx.stroke();

    // mouth
    ctx.beginPath();
    
    if (state.phase==="celebrating" && state.currentPlayer===player){
        ctx.moveTo(-5, 60);
        ctx.quadraticCurveTo(0, 56, 5, 60);
      } else {
        ctx.moveTo(-5, 56);
        ctx.quadraticCurveTo(0, 60, 5, 56);
      }
    
    ctx.stroke();
}

function drawBomb(){
    ctx.save();
    ctx.translate(state.bomb.x,state.bomb.y);

    if(state.phase==="aiming"){
        ctx.translate(-state.bomb.velocity.x/6.25,-state.bomb.velocity.y/6.25);

    //drawing bomb trajectory to justify speed
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.setLineDash([3, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(state.bomb.velocity.x, state.bomb.velocity.y);
    ctx.stroke();
    
    //draw circle indicating bomb
    ctx.fillStyle="rgba(0,100,0,1)"
    ctx.beginPath();
    ctx.arc(0,0,10,0,2*Math.PI);
    ctx.fill();
}
    else if(state.phase==="inFlight"){
        ctx.fillStyle="rgba(0,100,0,1)";
        ctx.rotate(state.bomb.rotation);
        ctx.beginPath();
        ctx.moveTo(-8,-2);
        ctx.quadraticCurveTo(0,12,8,-2);
        ctx.quadraticCurveTo(0,2,-8,-2);
        ctx.fill();
    }
    else{
        ctx.fillStyle="rgba(0,100,0,1)"
        ctx.beginPath();
        ctx.arc(0,0,6,0,2*Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

function calculateScale(){
    const lastBuilding=state.backgroundBuildings.at(-1);
    const totalWidth=lastBuilding.x+lastBuilding.width;

    state.scale=window.innerWidth/totalWidth;
}

window.addEventListener("resize",()=>{
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    calculateScale();
    draw();
})


// event handlers
bombGrabAreaDOM.addEventListener("mousedown",function(e){
    if(state.phase==="aiming"){
      isDragging=true;
      dragStartX=e.clientX;
      dragStartY=e.clientY;
      document.body.style.cursor="grab";
    }
});
  
window.addEventListener("mousemove",function(e){
    if(isDragging){
      let deltaX=e.clientX-dragStartX;
      let deltaY=e.clientY-dragStartY;
      
      state.bomb.velocity.x=-deltaX;
      state.bomb.velocity.y= deltaY;
      setInfo(deltaX,deltaY);
        
      document.body.style.cursor="grab";
      draw();
    }
});  

// see value on info
function setInfo(deltaX,deltaY){
    const hypotenuse = Math.sqrt(deltaX**2 + deltaY**2);
    const angleInRadians = Math.asin(deltaY / hypotenuse);
    const angleInDegrees = (angleInRadians/ Math.PI  )* 180;

    if (state.currentPlayer===1){
        angle1DOM.innerText = Math.round(angleInDegrees);
        velocity1DOM.innerText = Math.round(hypotenuse);
    } else{
        angle2DOM.innerText = Math.round(angleInDegrees);
        velocity2DOM.innerText = Math.round(hypotenuse);
    }
}
window.addEventListener("mouseup",function(){
    if(isDragging){
        isDragging=false;
        document.body.style.cursor="default";
        throwBomb();
    }
});

function throwBomb(){
    state.phase="inFlight";
    previousAnimationTimestamp=undefined;
    requestAnimationFrame(animate);
}

function animate(timestamp){
    
    if(previousAnimationTimestamp===undefined){
        previousAnimationTimestamp=timestamp;
        requestAnimationFrame(animate);
        return;
    }

    const elapsedTime=timestamp-previousAnimationTimestamp;
    const hitDetectionAccuracy=10;
    for(let i=0; i<hitDetectionAccuracy; i++){

    moveBomb(elapsedTime/hitDetectionAccuracy);

    const miss= checkFrameHit() || checkBuildingHit();
    const hit = checkGorillaHit();

    if(miss){
        state.currentPlayer=state.currentPlayer===1? 2:1;
        state.phase="aiming";
        initializeBombPosition();
        draw();
        return;
    }
    if(hit){
        state.phase="celebrating";
        updatePoints();
        draw();
        function celebration(){
            return new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    console.log("resuming...");
                    resolve();
                },2000);
            });
        }
        
        async function pausing(){
            console.log("pausing...")
            await celebration();
            state.currentPlayer=state.currentPlayer===1? 2:1;
            state.phase="aiming";
            initializeBombPosition();
            draw();
        }
        pausing();
        
        return;
    }
    }
    draw();
    previousAnimationTimestamp=timestamp;
    requestAnimationFrame(animate);
}

function moveBomb(elapsedTime){ 
    const multiplier=elapsedTime/200;
    state.bomb.velocity.x+=state.windSpeed*multiplier;
    state.bomb.velocity.y-=20*multiplier;
    state.bomb.x+=state.bomb.velocity.x*multiplier;
    state.bomb.y+=state.bomb.velocity.y*multiplier;

    //rotation to bomb
    const direction=1;
    state.bomb.rotation+=direction*5*multiplier;
}

function checkFrameHit() {
    if (
      state.bomb.y<0 || state.bomb.x<-state.shift/state.scale || state.bomb.x > (window.innerWidth - state.shift) / state.scale
    ) {
      return true; 
    }
}

function checkBuildingHit() {
    for (let i = 0; i < state.buildings.length; i++) {
      const building = state.buildings[i];
      if (
        state.bomb.x + 4 > building.x &&
        state.bomb.x - 4 < building.x + building.width &&
        state.bomb.y - 4 < 0 + building.height
      ) {
      for (let j = 0; j < state.blastHoles.length; j++) {
        const blastHole = state.blastHoles[j];

        const horizontalDistance = state.bomb.x - blastHole.x;
        const verticalDistance = state.bomb.y - blastHole.y;
        const distance = Math.sqrt(
          horizontalDistance ** 2 + verticalDistance ** 2);
        if (distance < blastHoleRadius) {
          return false;
        }
      }  
      state.blastHoles.push({ x: state.bomb.x, y: state.bomb.y });
      return true; 
      }
  }
}  

function checkGorillaHit() {
    const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
    const enemyBuilding =enemyPlayer === 1
        ? state.buildings.at(1) 
        : state.buildings.at(-2); 
    ctx.save();
    ctx.translate(
      enemyBuilding.x + enemyBuilding.width / 2,
      enemyBuilding.height
    );
    drawGorillaBody();
    let hit = ctx.isPointInPath(state.bomb.x, state.bomb.y);
  
    drawGorillaLeftArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);
  
    drawGorillaRightArm(enemyPlayer);
    hit ||= ctx.isPointInStroke(state.bomb.x, state.bomb.y);
    ctx.restore();
    return hit;
}
  
function updatePoints(){
    state.currentPlayer=state.currentPlayer===1? 1:2;
        if(state.currentPlayer===1){
            const currentPoints=parseInt(points1DOM.innerText);
            const updatedPoints=currentPoints+1;
            points1DOM.innerText=updatedPoints;
        }
        else{
            const currentPoints=parseInt(points2DOM.innerText);
            const updatedPoints=currentPoints+1;
            points2DOM.innerText=updatedPoints;
        }
        const newWindSpeed=generateWindSpeed();
        windSpeedDOM.innerText=newWindSpeed;
        state.windSpeed=newWindSpeed;
}        
            
function generateWindSpeed() {
    return parseInt(-10 + Math.random() * 20);
}

    
  
    
  
    
  
