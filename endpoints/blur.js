const router = require('express').Router();

const Canvas = require('@napi-rs/canvas');
const request = require('node-superfetch');
const path = require('path');

module.exports = async (req, res) => {
    const { body } = await request.get(req.query.url);
    
    const avatar = await Canvas.loadImage(body);
    const dimensions = avatar.width <= avatar.height ? avatar.width : avatar.height;

    const canvas = Canvas.createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const blur = function(src, dst, width, height, radius) {
        var tableSize = radius * 2 + 1;
        var radiusPlus1 = radius + 1;
        var widthMinus1 = width - 1;

        var r,g,b,a;

        var srcIndex = 0;
        var dstIndex;
        var p, next, prev;
        var i,l,x,y,nextIndex,prevIndex;

        var sumTable = [];
        for (i = 0, l = 256 * tableSize; i < l; i += 1) {
            sumTable[i] = (i / tableSize) | 0;
        }

        for (y = 0; y < height; y += 1) {
            r = g = b = a = 0;
            dstIndex = y;

            p = srcIndex << 2;
            r += radiusPlus1 * src[p];
            g += radiusPlus1 * src[p + 1];
            b += radiusPlus1 * src[p + 2];
            a += radiusPlus1 * src[p + 3];

            for (i = 1; i <= radius; i += 1) {
                p = (srcIndex + (i < width ? i : widthMinus1)) << 2;
                r += src[p];
                g += src[p + 1];
                b += src[p + 2];
                a += src[p + 3];
            }
            
            for (x = 0; x < width; x += 1) {
                p = dstIndex << 2;
                dst[p] = sumTable[r];
                dst[p + 1] = sumTable[g];
                dst[p + 2] = sumTable[b];
                dst[p + 3] = sumTable[a];

                nextIndex = x + radiusPlus1;
                if (nextIndex > widthMinus1) {
                    nextIndex = widthMinus1
                }

                prevIndex = x - radius;
                if (prevIndex < 0) {
                    prevIndex = 0;
                }

                next = (srcIndex + nextIndex) << 2;
                prev = (srcIndex + prevIndex) << 2;

                r += src[next] - src[prev];
                g += src[next + 1] - src[prev + 1];
                b += src[next + 2] - src[prev + 2];
                a += src[next + 3] - src[prev + 3];
                
                dstIndex += height;
            }
            srcIndex += width;
        }
    }

    const createImageData = (w, h) =>
        Canvas.createCanvas(w, h)
            .getContext('2d')
            .getImageData(0, 0, w, h);

    const quality = 5;
    const hRadius = 5;
    const vRadius = 5;

    var srcPixels = imageData.data,
        srcWidth = imageData.width,
        srcHeight = imageData.height,
        srcLength = srcPixels.length,
        dstImageData = createImageData(srcWidth, srcHeight),
        dstPixels = dstImageData.data,
        tmpImageData = createImageData(srcWidth, srcHeight),
        tmpPixels = tmpImageData.data;

        for (var i = 0; i < quality; i += 1) {
            blur(
                i ? dstPixels : srcPixels,
                tmpPixels,
                srcWidth,
                srcHeight,
                hRadius
            );
            blur(tmpPixels, dstPixels, srcHeight, srcWidth, vRadius);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(dstImageData, 0, 0);
        
        res.header('Content-Type', 'application/json');
        res.send({ success: true, body: new Buffer.from(canvas.toBuffer(), 'base64'), ext: '.png'})
}