/*
 Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

import { ShaderInfo } from '../base/define';
import { Shader } from '../base/shader';
import { WebGL2CmdFuncCreateShader, WebGL2CmdFuncDestroyShader } from './webgl2-commands';
import { WebGL2DeviceManager } from './webgl2-define';
import { IWebGL2GPUShader, IWebGL2GPUShaderStage } from './webgl2-gpu-objects';

/** @mangle */
export class WebGL2Shader extends Shader {
    constructor () {
        super();
    }

    get gpuShader (): IWebGL2GPUShader {
        if (this._gpuShader!.glProgram === null) {
            WebGL2CmdFuncCreateShader(WebGL2DeviceManager.instance, this._gpuShader!);
        }
        return  this._gpuShader!;
    }

    private _gpuShader: IWebGL2GPUShader | null = null;

    public initialize (info: Readonly<ShaderInfo>): void {
        this._name = info.name;
        this._stages = info.stages;
        this._attributes = info.attributes;
        this._blocks = info.blocks;
        this._samplers = info.samplers;

        this._gpuShader = {
            name: info.name,
            blocks: info.blocks.slice(),
            samplerTextures: info.samplerTextures.slice(),
            subpassInputs: info.subpassInputs.slice(),

            gpuStages: new Array<IWebGL2GPUShaderStage>(info.stages.length),
            glProgram: null,
            glInputs: [],
            glUniforms: [],
            glBlocks: [],
            glSamplerTextures: [],
        };

        for (let i = 0; i < info.stages.length; ++i) {
            const stage = info.stages[i];
            this._gpuShader.gpuStages[i] = {
                type: stage.stage,
                source: stage.source,
                glShader: null,
            };
        }
    }

    public destroy (): void {
        if (this._gpuShader) {
            WebGL2CmdFuncDestroyShader(WebGL2DeviceManager.instance, this._gpuShader);
            this._gpuShader = null;
        }
    }
}
