module.exports = class Utils {
    static blur(src, dst, width, height, radius) {
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

    static desaturate(ctx, level, x, y, width, height) {
        const data = ctx.getImageData(x, y, width, height);
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const dest = ((i * width) + j) * 4;
                const grey = Number.parseInt(
                    (0.2125 * data.data[dest]) + (0.7154 * data.data[dest + 1]) + (0.0721 * data.data[dest + 2]), 10
                );
                data.data[dest] += level * (grey - data.data[dest]);
                data.data[dest + 1] += level * (grey - data.data[dest + 1]);
                data.data[dest + 2] += level * (grey - data.data[dest + 2]);
            }
        }
        ctx.putImageData(data, x, y);
        return ctx;
    }

    static contrast(ctx, x, y, width, height) {
        const data = ctx.getImageData(x, y, width, height);
        const factor = (259 / 100) + 1;
        const intercept = 128 * (1 - factor);

        for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] = (data.data[i] * factor) + intercept;
            data.data[i + 1] = (data.data[i + 1] * factor) + intercept;
            data.data[i + 2] = (data.data[i + 2] * factor) + intercept;
        }

        ctx.putImageData(data, x, y);
        return ctx;
    }

    static checkIfMandelSet(x, y) {
        let rCompRes = x;
        let iCompRes = y;

        const maxIterations = 300;

        for (let i = 0; i < maxIterations; i++) {
            const trc = rCompRes * rCompRes - iCompRes * iCompRes + x;
            const tic = 2 * rCompRes * iCompRes + y;

            rCompRes = trc;
            iCompRes = tic;

            if (rCompRes * iCompRes > 5) {
                return (i / maxIterations) * 100;
            }
        }

        return 0;
    }

    static async nonBlockLoop(iterations, func, args) {
        let blockedSince = Date.now();

        async function unblock() {
            if (blockedSince + 15 > Date.now()) {
                await new Promise(resolve => setImmediate(resolve));
                blockedSince = Date.now();
            }
        }

        for (let i = 0; i < iterations; i++) {
            await unblock();
            const response = await func(i, args);

            if (response) {
                args = response;
            }

            if (args?.break === true) {
                delete args.break;
                break;
            }
        }
        return args;
    }

    static centerImagePart(data, maxWidth, maxHeight, widthOffset, heightOffset) {
        let { width, height } = data;

        if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height *= ratio;
        }

        if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width *= ratio;
        }

        const x = widthOffset + ((maxWidth / 2) - (width / 2));
        const y = heightOffset + ((maxHeight / 2) - (height / 2));

        return { x, y, width, height }
    }

    static distort(ctx, amplitude, x, y, width, height, strideLevel = 4) {
        const data = ctx.getImageData(x, y, width, height);
        const temp = ctx.getImageData(x, y, width, height);
        const stride = width * strideLevel;

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const xs = Math.round(amplitude * Math.sin(2 * Math.PI * 3 * (j / height)));
                const ys = Math.round(amplitude * Math.cos(2 * Math.PI * 3 * (i / width)));

                const dest = (j * stride) + (i * strideLevel);
                const src = ((j + ys) * stride) + ((i + xs) * strideLevel);

                data.data[dest] = temp.data[src];
                data.data[dest + 1] = temp.data[src + 1];
                data.data[dest + 2] = temp.data[src + 2];
            }
        }

        ctx.putImageData(data, x, y);
        return ctx;
    }
}