/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

const spriteAssembler = require('../sprite');
const { packToDynamicAtlas } = require('../../../../utils/utils');

module.exports = spriteAssembler.simple = {
    createData (sprite) {
        if (sprite._renderHandle.meshCount > 0) return;
        sprite._renderHandle.createQuadData(0, 4, 6);
    },

    updateRenderData (sprite) {
        let frame = sprite._spriteFrame;
        if (!frame) return;

        packToDynamicAtlas(sprite, frame);

        if (sprite._vertsDirty) {
            this.updateVerts(sprite);
            sprite._vertsDirty = false;
        }
    },

    fillBuffers (sprite, renderer) {
        let node = sprite.node,
            color = node._color._val,
            matrix = node._worldMatrix,
            a = matrix.m00, b = matrix.m01, c = matrix.m04, d = matrix.m05,
            tx = matrix.m12, ty = matrix.m13,    
            buffer = renderer._meshBuffer;

        let offsetInfo = buffer.request(4, 6);
        
        // buffer data may be realloc, need get reference after request.
        let indiceOffset = offsetInfo.indiceOffset,
            vertexOffset = offsetInfo.byteOffset >> 2,
            vertexId = offsetInfo.vertexOffset,
            vbuf = buffer._vData,
            uintbuf = buffer._uintVData,
            ibuf = buffer._iData;

        // get uv from sprite frame directly
        let uv = sprite._spriteFrame.uv;
        vbuf[vertexOffset + 2] = uv[0];
        vbuf[vertexOffset + 3] = uv[1];
        vbuf[vertexOffset + 7] = uv[2];
        vbuf[vertexOffset + 8] = uv[3];
        vbuf[vertexOffset + 12] = uv[4];
        vbuf[vertexOffset + 13] = uv[5];
        vbuf[vertexOffset + 17] = uv[6];
        vbuf[vertexOffset + 18] = uv[7];

        let verts = sprite._renderHandle.vDatas[0],
            vl = verts[0], vr = verts[2],
            vb = verts[1], vt = verts[3];

        let al = a * vl, ar = a * vr,
            bl = b * vl, br = b * vr,
            cb = c * vb, ct = c * vt,
            db = d * vb, dt = d * vt;

        // left bottom
        vbuf[vertexOffset] = al + cb + tx;
        vbuf[vertexOffset + 1] = bl + db + ty;
        // right bottom
        vbuf[vertexOffset + 5] = ar + cb + tx;
        vbuf[vertexOffset + 6] = br + db + ty;
        // left top
        vbuf[vertexOffset + 10] = al + ct + tx;
        vbuf[vertexOffset + 11] = bl + dt + ty;
        // right top
        vbuf[vertexOffset + 15] = ar + ct + tx;
        vbuf[vertexOffset + 16] = br + dt + ty;

        // color
        uintbuf[vertexOffset + 4] = color;
        uintbuf[vertexOffset + 9] = color;
        uintbuf[vertexOffset + 14] = color;
        uintbuf[vertexOffset + 19] = color;

        // fill indice data
        ibuf[indiceOffset++] = vertexId;
        ibuf[indiceOffset++] = vertexId + 1;
        ibuf[indiceOffset++] = vertexId + 2;
        ibuf[indiceOffset++] = vertexId + 1;
        ibuf[indiceOffset++] = vertexId + 3;
        ibuf[indiceOffset++] = vertexId + 2;
    },

    updateVerts (sprite) {
        let node = sprite.node,
            cw = node.width, ch = node.height,
            appx = node.anchorX * cw, appy = node.anchorY * ch,
            l, b, r, t;
        if (sprite.trim) {
            l = -appx;
            b = -appy;
            r = cw - appx;
            t = ch - appy;
        }
        else {
            let frame = sprite.spriteFrame,
                ow = frame._originalSize.width, oh = frame._originalSize.height,
                rw = frame._rect.width, rh = frame._rect.height,
                offset = frame._offset,
                scaleX = cw / ow, scaleY = ch / oh;
            let trimLeft = offset.x + (ow - rw) / 2;
            let trimRight = offset.x - (ow - rw) / 2;
            let trimBottom = offset.y + (oh - rh) / 2;
            let trimTop = offset.y - (oh - rh) / 2;
            l = trimLeft * scaleX - appx;
            b = trimBottom * scaleY - appy;
            r = cw + trimRight * scaleX - appx;
            t = ch + trimTop * scaleY - appy;
        }

        this.setVerts(sprite, l, b, r, t);
    },

    setVerts (sprite, l, b, r, t) {
        let verts = sprite._renderHandle.vDatas[0];

        verts[0] = l;
        verts[1] = b;
        verts[2] = r;
        verts[3] = t;
    }
};
