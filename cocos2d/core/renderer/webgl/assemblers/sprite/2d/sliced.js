/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

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

const base = require('./base');
const spriteAssembler = require('../sprite');
const packToDynamicAtlas = require('../../../../utils/utils').packToDynamicAtlas;

module.exports = spriteAssembler.sliced = cc.js.addon({
    verticesCount: 16,
    verticesFloats: 16 * base.floatsPerVert,
    indicesCount: 54,

    createData (sprite) {
        if (sprite._renderHandle.meshCount > 0) return;
        sprite._renderHandle.createData(0, this.verticesFloats, this.indicesCount);
        sprite._renderHandle._local = new Float32Array(8);

        let indices = sprite._renderHandle.iDatas[0];
        let indexOffset = 0;
        for (let r = 0; r < 3; ++r) {
            for (let c = 0; c < 3; ++c) {
                let start = r * 4 + c;
                indices[indexOffset++] = start;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + 4;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + 5;
                indices[indexOffset++] = start + 4;
            }
        }
    },

    updateRenderData (sprite) {
        let frame = sprite._spriteFrame;
        if (!frame) return;
        packToDynamicAtlas(sprite, frame);

        if (sprite._vertsDirty) {
            this.updateColor(sprite);
            this.updateUVs(sprite);
            this.updateVerts(sprite);
            sprite._vertsDirty = false;
        }
    },

    updateVerts (sprite) {
        let node = sprite.node,
            width = node.width, height = node.height,
            appx = node.anchorX * width, appy = node.anchorY * height;

        let frame = sprite.spriteFrame;
        let leftWidth = frame.insetLeft;
        let rightWidth = frame.insetRight;
        let topHeight = frame.insetTop;
        let bottomHeight = frame.insetBottom;

        let sizableWidth = width - leftWidth - rightWidth;
        let sizableHeight = height - topHeight - bottomHeight;
        let xScale = width / (leftWidth + rightWidth);
        let yScale = height / (topHeight + bottomHeight);
        xScale = (isNaN(xScale) || xScale > 1) ? 1 : xScale;
        yScale = (isNaN(yScale) || yScale > 1) ? 1 : yScale;
        sizableWidth = sizableWidth < 0 ? 0 : sizableWidth;
        sizableHeight = sizableHeight < 0 ? 0 : sizableHeight;

        // update local
        let local = sprite._renderHandle._local;
        local[0] = -appx;
        local[1] = -appy;
        local[2] = leftWidth * xScale - appx;
        local[3] = bottomHeight * yScale - appy;
        local[4] = local[2] + sizableWidth;
        local[5] = local[3] + sizableHeight;
        local[6] = width - appx;
        local[7] = height - appy;

        this.updateWorldVerts(sprite);
    },

    updateUVs (sprite) {
        let verts = sprite._renderHandle.vDatas[0];
        let uvSliced = sprite.spriteFrame.uvSliced;
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        for (let row = 0; row < 4; ++row) {
            for (let col = 0; col < 4; ++col) {
                let vid = row * 4 + col;
                let uv = uvSliced[vid];
                let voffset = vid * floatsPerVert;
                verts[voffset + uvOffset] = uv.u;
                verts[voffset + uvOffset + 1] = uv.v;
            }
        }
    },

    updateWorldVerts (sprite) {
        let matrix = sprite.node._worldMatrix,
            a = matrix.m00, b = matrix.m01, c = matrix.m04, d = matrix.m05,
            tx = matrix.m12, ty = matrix.m13;

        let renderHandle = sprite._renderHandle;
        let local = renderHandle._local;
        let world = renderHandle.vDatas[0];

        let floatsPerVert = this.floatsPerVert;
        for (let row = 0; row < 4; ++row) {
            let localRowY = local[row * 2 + 1];
            for (let col = 0; col < 4; ++col) {
                let localColX = local[col * 2];
                let worldIndex = (row * 4 + col) * floatsPerVert;
                world[worldIndex] = localColX * a + localRowY * c + tx;
                world[worldIndex + 1] = localColX * b + localRowY * d + ty;
            }
        }
    },
}, base);
