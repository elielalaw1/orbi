import { angularFootprint, fitFaceScale } from "./FaceGeometry";
import vertex from "./shaders/dome.vert.glsl?raw";
import fragment from "./shaders/dome.frag.glsl?raw";
import type { Frame } from "../character/FaceAnimator";
import type { Settings } from "../app/types";
export class DomeRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniforms = new Map<string, WebGLUniformLocation>();
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl)
      throw Error(
        "WebGL2 is unavailable. Use a current Chrome, Edge or Firefox with hardware acceleration enabled.",
      );
    this.gl = gl;
    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(sh) || "Shader compilation failed");
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(program) || "Shader link failed");
    this.program = program;
    gl.useProgram(program);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    for (const name of [
      "uFire",
      "uScene",
      "uRoutine",
      "uFloodTime",
      "uRes",
      "uColor",
      "uExpression",
      "uFace",
      "uDetails",
      "uMotion",
      "uExtra",
      "uBrightness",
      "uGuides",
    ])
      this.uniforms.set(name, gl.getUniformLocation(program, name)!);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      document.dispatchEvent(
        new CustomEvent("orbi-error", {
          detail:
            "Graphics context lost. Reload this window to restore projection.",
        }),
      );
    });
  }
  render(f: Frame, s: Settings, resolution = s.resolution, floodTime = -1) {
    const gl = this.gl,
      u = (n: string) => this.uniforms.get(n)!;
    if (this.canvas.width !== resolution) {
      this.canvas.width = this.canvas.height = resolution;
      gl.viewport(0, 0, resolution, resolution);
    }
    gl.useProgram(this.program);
    gl.uniform1f(u("uFloodTime"), floodTime);
    gl.uniform1f(u("uFire"), f.fire ?? 0);
    gl.uniform2f(u("uScene"),f.scene,f.sceneTime);
    gl.uniform4f(u("uRoutine"),f.hearts,f.kiss,f.run,f.seconds);
    gl.uniform2f(u("uRes"), resolution, resolution);
    gl.uniform3fv(u("uColor"), f.expression.color);
    gl.uniform4f(
      u("uExpression"),
      f.expression.eye,
      f.expression.smile,
      f.expression.open,
      f.expression.brow,
    );
    const rimMargin =
      80 * (1 - Math.hypot(f.position.masterX, f.position.masterY));
    const safeScale = s.fullDome
      ? fitFaceScale(
          Math.hypot(f.position.masterX, f.position.masterY),
          s.faceScale,
          angularFootprint(s, f.expression, f.breath, f.position.lean),
        )
      : Math.min(
          s.faceScale,
          (45 - f.position.el) / 17,
          (f.position.el + 16) / 17,
        );
    gl.uniform4f(
      u("uFace"),
      f.position.az + f.shake,
      f.position.el,
      s.fullDome ? safeScale : Math.max(0.5, safeScale),
      s.rotation + f.position.roll,
    );
    gl.uniform4f(
      u("uDetails"),
      f.expression.tilt,
      f.expression.wink,
      s.eyeSpacing,
      s.mouthScale,
    );
    gl.uniform4f(u("uMotion"), f.gazeX, f.gazeY, f.blink, f.breath);
    gl.uniform2f(u("uExtra"), s.browOffset, f.position.lean);
    gl.uniform1f(u("uBrightness"), s.brightness);
    gl.uniform1i(u("uGuides"), s.guides ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
