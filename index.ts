/// <reference lib="dom" />
/// <reference lib="dom.iterable" />



import {load} from "opentype.js";
let notoSans = "fonts/NotoSansCJKtc-Thin.otf";
let notoSerif = "fonts/NotoSerifCJKtc-Light.otf";
let cwt = "fonts/cwTexMing.ttf";
let sourceHan = "fonts/SourceHanSansTC-VF.ttf";
let sourceHanSerif = "fonts/SourceHanSerifTC-VF.ttf";

load(sourceHanSerif, function(err, font) {
    if (err) {
        alert('Font could not be loaded: ' + err);
    } else {
        let offscreen = new OffscreenCanvas(10000, 10000);
        let offscreenCtx = offscreen.getContext("2d");
        // Now let's display it on a canvas with id "canvas"
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        

        if (canvas == undefined) {
            return;
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        

        // Construct a Path object containing the letter shapes of the given text.
        // The other parameters are x, y and fontSize.
        // Note that y is the position of the baseline.
        if (font == undefined) {
            return;
        }
        let fontSize = 2048;

        const path = font.getPath('臺', 0, fontSize, fontSize, {kerning: true});
        const bBox = path.getBoundingBox();
        // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
        if (ctx == undefined) {
            return ;
        }
        
        // font.draw(ctx, "新竹", 0, 128, 128);
        // font.drawMetrics(ctx, "新竹", 0, 128, 128);
        if (offscreenCtx == null){
            console.log("test")
            return;
        }
        path.draw(offscreenCtx);
        let width = Math.ceil(bBox.x2 - bBox.x1);
        let height = Math.ceil(bBox.y2 - bBox.y1);

        
        let dimension = Math.max(width, height); 
        let padding = 30;
        dimension += padding;
        const imgData = offscreenCtx.getImageData(bBox.x1, bBox.y1, dimension, dimension);

        // ctx.putImageData(imgData, 0, 0);
        console.log("width", width);
        console.log("height", height);
        console.log("dimension", dimension);
        let numOfRows = imgData.data.length / (dimension * 4);
        console.log("num of row: ", numOfRows);
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

        for (let index = 0; index < numOfRows; index++){
            let row = [];
            for(let col = 0; col < dimension; col++){
                let curCellIndex = index * dimension + col;
                row.push(inFours[curCellIndex]);
            }
            pixelated.push(row);
        }

        let numberOfLights = 48;
        let lightPixels = Math.floor(numOfRows / numberOfLights);
        console.log(imgData);
        console.log("pixels per height:", lightPixels);
        console.log(pixelated);
        let rowArray = [];
        for (let rowIndex = 0; rowIndex < numberOfLights; rowIndex++){
            let startRowIndex = rowIndex * lightPixels;
            let endRowIndex = startRowIndex + lightPixels; // end index is exclusive
            // console.log("start row index: ", startRowIndex);
            // console.log("end row index:", endRowIndex - 1);
            let colArray: {r: number, g: number, b: number, a: number}[] = [];
            for (let colIndex = 0; colIndex < numberOfLights; colIndex++){
                let startColIndex = colIndex * lightPixels;
                let endColIndex = startColIndex + lightPixels; // end index is exclusive
                // console.log("start column index", startColIndex);
                // console.log("end column index:", endColIndex);
                let count = 0;
                let rSquaresSum = 0;
                let gSquaresSum = 0;
                let bSquaresSum = 0;
                let aSquaresSum = 0;
                for(let avgRow = startRowIndex; avgRow < Math.min(dimension, endRowIndex); avgRow++){
                    for(let avgCol = startColIndex; avgCol < Math.min(dimension, endColIndex); avgCol++){
                        let pixel = pixelated[avgRow][avgCol];
                        // console.log(pixel.r);
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
                    colArray.push({r: Math.sqrt(rSquaresMean), g: Math.sqrt(gSquaresMean), b: Math.sqrt(bSquaresMean), a: Math.sqrt(aSquaresMean)});
                }
            }
            rowArray.push(colArray);
        }
        console.log("lights: ", rowArray);
        console.log(Math.sqrt(0));
        let lightRadius = 1;
        let space = 1;
        let lights = [];
        let startX = lightRadius;
        let startY = lightRadius;
        for (let index = 0; index < numberOfLights; index++){
            for (let jindex = 0; jindex < numberOfLights; jindex++){
                let xCoord = startX + jindex * lightRadius * 2 + space * (1 + jindex);
                let yCoord = startY + index * lightRadius * 2 + space * (1 + index);
                // console.log("color:", rowArray[index][jindex]);
                lights.push({
                    x: xCoord,
                    y: yCoord,
                    color: {
                        r: rowArray[index][jindex].r,
                        g: rowArray[index][jindex].g,
                        b: rowArray[index][jindex].b,
                        a: rowArray[index][jindex].a
                    }
                })
            }
        }

        for (let index = 0; index < lights.length; index++){
            if (lights[index].color.a > 20){
                ctx.beginPath();
                ctx.fillStyle = `rgba(204, 102, 153, 255)`;
                ctx.arc(lights[index].x, lights[index].y, lightRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

});
