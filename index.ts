/// <reference lib="dom" />
/// <reference lib="dom.iterable" />



import {load} from "opentype.js";
import { BSON, Timestamp } from "bson";

let notoSans = "fonts/NotoSansCJKtc-Regular.otf";
let notoSerif = "fonts/NotoSerifCJKtc-Regular.otf";
let cwt = "fonts/cwTexMing.ttf";
let sourceHan = "fonts/SourceHanSansTW-Normal.otf";
let sourceHanHeavy = "fonts/SourceHanSansTW-Heavy.otf";
let sourceHanSerif = "fonts/SourceHanSerifTC-Regular.otf";
let testFont = "fonts/Cubic_11_1.013_R.ttf";

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

type Point = {
    x: number;
    y: number;
}

load(notoSans, async function(err, font) {
    if (err) {
        alert('Font could not be loaded: ' + err);
    } else {
        if (font == undefined) {
            return;
        }
        
        const canvas = document.getElementById("info-board") as HTMLCanvasElement;
        if (canvas == null){
            return;
        }
        const context = canvas.getContext("2d");
        if (context == null){
            return;
        }
        const lightDimensionPerChar = 24;
        const numberOfCharInLimitingAxis = 1;
        const spaceToLightDiameterRatio = 0;
        const limitingDimension = Math.min(canvas.width, canvas.height);
        const inputString = "本次列車沿途停靠";
        const inputStringLights = [];
        for(let index = 0; index < inputString.length; index++){
            inputStringLights.push(convertCharToBitmap(font, inputString[index], lightDimensionPerChar));
        }
        const charCount = inputString.length;
        console.log("limiting Dimension", limitingDimension);

        // Have to fit number of lights per char within the limiting axis
        const numberOfLightsInLimitingAxis = numberOfCharInLimitingAxis * lightDimensionPerChar;
        const numberOfSpaceInLimitingAxis = numberOfLightsInLimitingAxis - 1;
        // numberOfLightsInLimitingAxis * radius * 2 + numberofSpaceInLimitingAxis * radius * 2 * spaceToLightDiameterRatio = fullPixelLengthInLimitingAxis
        // 2R * (numberOfLightsInLimitingAxis + numberOfSpaceInLimitingAxis * spaceToLightDiameterRatio) = fullPixelLengthInLimitingAxis
        const lightRadius = limitingDimension / (2 * numberOfLightsInLimitingAxis + numberOfSpaceInLimitingAxis * spaceToLightDiameterRatio);
        const spaceLength = lightRadius * 2 * spaceToLightDiameterRatio;
        console.log("Light Radius is calculated to be:", lightRadius);
        console.log("Space Length is calculated to be:", spaceLength);

        const unitLength = lightRadius * 2 + spaceLength;
        console.log("Unit Length", unitLength);
        const charCountInLooseAxis = (Math.max(canvas.width, canvas.height) / unitLength) / lightDimensionPerChar;
        console.log("You can fit in", charCountInLooseAxis, "characters in the longer axis");
        const xLightIndexAtTheEnd = Math.ceil((canvas.width - lightRadius) / unitLength);
        const topLeftLightCenter = {x: lightRadius, y: lightRadius};
        const inputStringWidthInPixel = (charCount * lightDimensionPerChar) * lightRadius * 2+ (charCount * lightDimensionPerChar - 1) * spaceLength;
        const inputStringHeightInPixel = 1 * lightDimensionPerChar * lightRadius * 2 + (lightDimensionPerChar - 1) * spaceLength;
        let xCoord = topLeftLightCenter.x;
        while (xCoord < canvas.width){
            let yCoord = topLeftLightCenter.y;
            while(yCoord < canvas.height){
                context.beginPath();
                context.arc(xCoord, yCoord, lightRadius, 0, Math.PI * 2);
                context.fill();
                yCoord += (lightRadius * 2 + spaceLength);
            }
            xCoord += (lightRadius * 2 + spaceLength);
        }

        const backgroundImgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const backgronudBitMap = await createImageBitmap(backgroundImgData);
        
        const offscreenCanvas = new OffscreenCanvas(inputStringWidthInPixel, inputStringHeightInPixel);
        const offscreenContext = offscreenCanvas.getContext("2d");
        if (offscreenContext == null){
            return;
        }
        inputStringLights.forEach((lights, index)=>{
            let xCoordInputString = topLeftLightCenter.x + index * lightDimensionPerChar * unitLength;
            let yCoordInputString = topLeftLightCenter.y;

            for(let rowIndex = 0; rowIndex < lights.length; rowIndex++){
                yCoordInputString = topLeftLightCenter.y +  (rowIndex * unitLength);
                xCoordInputString = topLeftLightCenter.x + index * lightDimensionPerChar * unitLength;
                for(let colIndex = 0; colIndex < lights[rowIndex].length; colIndex++){
                    
                    if (lights[rowIndex][colIndex].color.a > 150){
                        offscreenContext.beginPath();
                        offscreenContext.arc(xCoordInputString, yCoordInputString, lightRadius, 0, Math.PI * 2);
                        offscreenContext.fillStyle = `rgba(${255}, ${255}, ${255}, ${255})`
                        //`rgba(${153}, ${255}, ${187}, ${255})`
                        offscreenContext.fill();
                    }
                    xCoordInputString += unitLength;
                }
            }
        });
        const inputStringImgData = offscreenContext.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const inputStringBitMap = await createImageBitmap(inputStringImgData);

        let prevTime = 0;
        let initialXIndex = xLightIndexAtTheEnd;
        const draw = (timeStamp: number)=>{
            const deltaTimeInSecond = (timeStamp - prevTime) / 1000;
            if (deltaTimeInSecond > 0.03){
                prevTime = timeStamp;
                initialXIndex -= 1;
            }
            canvas.width = canvas.width;
            context.drawImage(backgronudBitMap, 0, 0);
            context.drawImage(inputStringBitMap, initialXIndex * unitLength, 0);
            if(initialXIndex * unitLength < -inputStringWidthInPixel){
                initialXIndex = xLightIndexAtTheEnd;
            }
            window.requestAnimationFrame(draw);
        }

        window.requestAnimationFrame(draw);

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
    let widthLightPixels = Math.floor(width / numberOfLights);
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

function convertCharToBitmapWithVariableWidth(font: opentype.Font, char: string, numberOfLights: number=24) {

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
    let numberOfLightsInWidth = Math.floor(width / lightPixels);
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
