/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import {load} from "opentype.js";
import * as PIXI from 'pixi.js';
import { ColorMatrixFilter } from "pixi.js";

type Color = {
    r: number,
    g: number,
    b: number,
    a: number
}

type light = {
    rowIndex: number,
    colIndex: number,
    color: Color
}


const notoSans = "fonts/NotoSansCJKtc-Light.otf";
const notoSerif = "fonts/NotoSerifCJKtc-Regular.otf";
const cwt = "fonts/cwTexMing.ttf";
const sourceHan = "fonts/SourceHanSansTW-Normal.otf";
const sourceHanHeavy = "fonts/SourceHanSansTW-Heavy.otf";
const sourceHanSerif = "fonts/SourceHanSerifTC-Regular.otf";
const testFont = "fonts/Cubic_11_1.013_R.ttf";






load(cwt, function(err, font) {
    if (err) {
        alert('Font could not be loaded: ' + err);
    } else {
        if (font == undefined) {
            return;
        }
        const app = new PIXI.Application<HTMLCanvasElement>({
            background: 'white',
            resizeTo: window,
        });

        document.body.appendChild(app.view);
        const graphicsContainer = new PIXI.Container();
        const backdropContainer = new PIXI.Container();
        let lights:light[][] = convertCharToBitmap(font, "自");
        let nanLights: light[][] = convertCharToBitmap(font, "強");
        let stationLights: light[][] = convertCharToBitmap(font, "號");
        app.stage.addChild(backdropContainer);
        app.stage.addChild(graphicsContainer);
        let combined = {
            startPosition: {x: 0, y: 0},
            text: [
            {light: lights, startRow: 0, startCol: 0},
            {light: nanLights, startRow: 0, startCol: 24},
            {light: stationLights, startRow: 0, startCol: 48},
        ]}

        const canvas = document.getElementById("info-board") as HTMLCanvasElement;
        
        if (canvas == undefined) {
            return;
        }
        // canvas.width = window.innerWidth;
        // canvas.height = window.innerHeight;

        const ctx = canvas.getContext("2d");
        if (ctx == null) {
            return;
        }
        // Perform some drawing using the gl context
        let infoBoardHeightPixel = 100;
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

        const graphics = new PIXI.Graphics();

        backdropContainer.addChild(graphics);
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
                graphics.beginFill(`rgba(${0}, ${0}, ${0}, ${255})`);
                graphics.arc(curPosition.x, curPosition.y, lightRadius, 0, Math.PI * 2);
                graphics.endFill();

            }
            lightPositions.push(row);
        }

        combined.text.forEach((lightObj)=>{
            for(let stringRowIndex = 0; stringRowIndex < lightObj.light.length; stringRowIndex++){
                for(let stringColIndex = 0; stringColIndex < lightObj.light[stringRowIndex].length; stringColIndex++){
                    let row = lightObj.startRow + stringRowIndex;
                    let col = lightObj.startCol + stringColIndex;
                    
                    let x_coord = col * lightRadius * 2 + col * lightSpace + lightRadius;
                    let y_coord = row * lightRadius * 2 + row * lightSpace + lightRadius;
                    if (lightObj.light[stringRowIndex][stringColIndex].color.a > 150){
                        
                        lightPositions[row][col].color = {r: 153, g: 255, b: 187, a: 255};
                        const graphics = new PIXI.Graphics();
                        graphicsContainer.addChild(graphics);
                        graphics.beginFill(`rgba(${153}, ${255}, ${187}, ${255})`);
                        graphics.drawCircle(x_coord, y_coord, lightRadius);
                        graphics.endFill();
                    }
                }
            }
        });
        const colorMatrix = new ColorMatrixFilter();
        
        // graphicsContainer.filters = [colorMatrix];
        let lastChangeTime = 0;
        console.log(colorMatrix.matrix)
        app.ticker.add((delta) => {
            if (Date.now() - lastChangeTime >= 1000){
                console.log("Test");
                lastChangeTime = Date.now();
                if (colorMatrix.matrix[18] == 1){
                    colorMatrix.matrix[18] = 0;
                } else {
                    colorMatrix.matrix[18] = 1;
                }
                
            }
        });

        
        console.time('Execution Time');
        for(let rowIndex = 0; rowIndex < infoBoardHeight; rowIndex++){
            for(let colIndex = 0; colIndex < infoBoardWidth; colIndex++){
                ctx.beginPath();
                ctx.arc(lightPositions[rowIndex][colIndex].pos.x, lightPositions[rowIndex][colIndex].pos.y, lightRadius, 0, Math.PI * 2);
                
                ctx.fillStyle = `rgba(${lightPositions[rowIndex][colIndex].color.r},${lightPositions[rowIndex][colIndex].color.g},${lightPositions[rowIndex][colIndex].color.b}, 255)`;
                ctx.fill();
            }
        }
        console.timeEnd('Execution Time');

        let arbitrary = 100;
        // ctx.putImageData(imgData, 10 + lightRadius * arbitrary + lightSpace * (arbitrary - 1) , 0);
        let prevTime = 0;
    }

});






function convertCharToBitmap(font: opentype.Font, char: string, numberOfLights: number=24) {

    let offscreen = new OffscreenCanvas(2500, 2500);
    let offscreenCtx = offscreen.getContext("2d");

    if (font == undefined) {
        return [];
    }
    let fontSize = 512;

    const path = font.getPath(char, 0, fontSize, fontSize, {kerning: true});
    const bBox = path.getBoundingBox();

    if (offscreenCtx == null){
        return [];
    }
    path.draw(offscreenCtx);
    let width = Math.ceil(bBox.x2 - bBox.x1);
    let height = Math.ceil(bBox.y2 - bBox.y1);

    
    
    let dimension = Math.max(width, height); 
    let padding = 30;
    dimension += padding;
    let center = {x: bBox.x1 + width / 2, y: bBox.y1 + height / 2};
    let topLeft = {x: center.x - dimension / 2, y: center.y - dimension / 2};
    const imgData = offscreenCtx.getImageData(topLeft.x, topLeft.y, dimension, dimension);

    let inFours = [];
    let pixelated = [];
    for(let fourIndex = 0; fourIndex < imgData.data.length; fourIndex+= 4){
        inFours.push({
            r: imgData.data[fourIndex],
            g: imgData.data[fourIndex + 1], 
            b: imgData.data[fourIndex + 2],
            a: imgData.data[fourIndex + 3]
        })
    }

    for (let index = 0; index < dimension; index++){
        let row = [];
        for(let col = 0; col < dimension; col++){
            let curCellIndex = index * dimension + col;
            row.push(inFours[curCellIndex]);
        }
        pixelated.push(row);
    }

    let lightPixels = Math.floor(dimension / numberOfLights);
    let rowArray = [];

    for (let rowIndex = 0; rowIndex < numberOfLights; rowIndex++){
        let startRowIndex = rowIndex * lightPixels;
        let endRowIndex = startRowIndex + lightPixels; // end index is exclusive
        let colArray: light[] = [];

        for (let colIndex = 0; colIndex < numberOfLights; colIndex++){
            let startColIndex = colIndex * lightPixels;
            let endColIndex = startColIndex + lightPixels; // end index is exclusive
            let count = 0;
            let rSquaresSum = 0;
            let gSquaresSum = 0;
            let bSquaresSum = 0;
            let aSquaresSum = 0;
            for(let avgRow = startRowIndex; avgRow < Math.min(dimension, endRowIndex); avgRow++){
                for(let avgCol = startColIndex; avgCol < Math.min(dimension, endColIndex); avgCol++){
                    let pixel = pixelated[avgRow][avgCol];
                    count += 1;
                    rSquaresSum += (pixel.r * pixel.r);
                    gSquaresSum += (pixel.g * pixel.g);
                    bSquaresSum += (pixel.b * pixel.b);
                    aSquaresSum += (pixel.a * pixel.a);
                }
            }
            if(count != 0){
                let rSquaresMean = rSquaresSum / count;
                let gSquaresMean = gSquaresSum / count;
                let bSquaresMean = bSquaresSum / count;
                let aSquaresMean = aSquaresSum / count;
                colArray.push({rowIndex: rowIndex, colIndex: colIndex, color: {r: Math.sqrt(rSquaresMean), g: Math.sqrt(gSquaresMean), b: Math.sqrt(bSquaresMean), a: Math.sqrt(aSquaresMean)}});
            }
        }
        rowArray.push(colArray);
    }

    return rowArray;
}
