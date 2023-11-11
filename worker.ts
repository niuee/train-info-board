import { Timestamp } from "bson";





onmessage = (evt) => {
    const canvas = evt.data.canvas as OffscreenCanvas;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
        return;
    }
    console.log("drawing");
    // Perform some drawing using the gl context
        let infoBoardHeightPixel = 150;
        let infoBoardWidth = 24 * 6; // this is how many lights
        let infoBoardHeight = 24 * 1; 
        // radius * 2 * infoBoardHeight + space * (infoBoardHeight - 1) = full Height in pixel
        // radius * 2 * infoBoardWidth + space * (infoBoardWidth - 1) = full Width in pixel
        let spaceScale = 0.005;
        let lightRadius = infoBoardHeightPixel / (2 * infoBoardHeight + spaceScale * infoBoardHeight - spaceScale);
        let lightSpace = lightRadius * spaceScale;
        let infoBoardWidthPixel = infoBoardWidth * lightRadius * 2 + lightSpace * (infoBoardWidth - 1);
        
        let infoBoardStartPosition = {x: 10, y: 0};
        let lightPositions: {pos: {x:number, y: number}, color: {r: number, g: number, b: number, a: number}}[][] = [];

        for(let rowIndex = 0; rowIndex < infoBoardHeight; rowIndex++){
            let row = []
            for(let colIndex = 0; colIndex < infoBoardWidth; colIndex++){
                let curPosition = {x: infoBoardStartPosition.x - lightRadius + colIndex * (lightSpace + 2 * lightRadius), y: infoBoardStartPosition.y + lightRadius + rowIndex * (lightSpace + 2 * lightRadius)};
                row.push({pos: curPosition, color: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1,
                }});
            }
            lightPositions.push(row);
        }


        evt.data.combined.text.forEach((lightObj)=>{
            for(let stringRowIndex = 0; stringRowIndex < lightObj.light.length; stringRowIndex++){
                for(let stringColIndex = 0; stringColIndex < lightObj.light[stringRowIndex].length; stringColIndex++){
                    let row = lightObj.startRow + stringRowIndex;
                    let col = lightObj.startCol + stringColIndex;
                    
                    let x_coord = col * lightRadius * 2 + col * lightSpace + lightRadius;
                    let y_coord = row * lightRadius * 2 + row * lightSpace + lightRadius;
                    if (lightObj.light[stringRowIndex][stringColIndex].color.a > 150){
                        ctx.beginPath();
                        ctx.arc(x_coord, y_coord, lightRadius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${153}, ${255}, ${187}, ${255})`;
                        ctx.fill();
                    }else {
                        ctx.beginPath();
                        ctx.arc(x_coord, y_coord, lightRadius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${0}, ${0}, ${0}, ${1})`;
                        ctx.fill();
                    }
                }
            }
        });
        let lightCount = evt.data.combined.text[evt.data.combined.text.length - 1].startCol + 24;
        let maxWidth = lightCount * lightRadius * 2 + (lightCount - 1) * lightSpace;
        let imgData = ctx.getImageData(0, 0, maxWidth, infoBoardHeightPixel);
        ctx.clearRect(0, 0, 1500, 1500);
       
        
        // for(let rowIndex = 0; rowIndex < infoBoardHeight; rowIndex++){
        //     for(let colIndex = 0; colIndex < infoBoardWidth; colIndex++){
        //         ctx.beginPath();
        //         ctx.arc(lightPositions[rowIndex][colIndex].pos.x, lightPositions[rowIndex][colIndex].pos.y, lightRadius, 0, Math.PI * 2);
                
        //         ctx.fillStyle = "rgba(0, 0, 0, 1)";
        //         ctx.fill();
        //     }
        // }

        let arbitrary = 0;
        ctx.putImageData(imgData, 10 + lightRadius * arbitrary + lightSpace * (arbitrary - 1) , 0);

};