(function () {
    var preloader = document.getElementById("preloader");
    var canvas = document.getElementById("atomic-preloader-grain");

    if (preloader) {
        var dismissed = false;

        function dismissPreloader() {
            if (dismissed || preloader.classList.contains("is-hidden")) return;
            dismissed = true;
            preloader.classList.add("is-exiting");
            window.setTimeout(function () {
                preloader.classList.add("is-hidden");
                preloader.style.display = "none";
                preloader.setAttribute("aria-hidden", "true");
            }, 1200);
        }

        if (preloader.style.display === "none") {
            preloader.classList.add("is-hidden");
        }

        var observer = new MutationObserver(function () {
            if (preloader.style.display === "none") {
                preloader.classList.add("is-hidden");
            }
        });
        observer.observe(preloader, { attributes: true, attributeFilter: ["style"] });

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () {
                window.setTimeout(dismissPreloader, 900);
            }, { once: true });
        } else {
            window.setTimeout(dismissPreloader, 900);
        }

        window.addEventListener("load", function () {
            window.setTimeout(dismissPreloader, 500);
        }, { once: true });

        window.setTimeout(dismissPreloader, 3200);
    }

    if (!canvas) return;

    function syncSize() {
        var width = canvas.clientWidth || 1280;
        var height = canvas.clientHeight || 720;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    var vertexShaderSource = "attribute vec2 a_position;\nvarying vec2 v_texCoord;\nvoid main() {\n  v_texCoord = a_position * 0.5 + 0.5;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
    var fragmentShaderSource = "precision highp float;\nuniform float u_time;\nuniform vec2 u_resolution;\nfloat random(vec2 st) {\n  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);\n}\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_resolution.xy;\n  float n = random(uv + u_time * 0.01);\n  vec3 color = vec3(0.02 + n * 0.03);\n  gl_FragColor = vec4(color, 1.0);\n}";

    function compileShader(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    var program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    var position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(program, "u_time");
    var uResolution = gl.getUniformLocation(program, "u_resolution");

    function render(time) {
        if (typeof ResizeObserver === "undefined") syncSize();
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, time * 0.001);
        if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
