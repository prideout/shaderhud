function create_shaderhud(canvas, gl) {
    canvas.insertAdjacentHTML('afterend', `
        <div style="position:absolute;top:0;left:0;right:0" id="shaderhud">
            <select id="shaderhud-select">
                <option value="">hide shaderhud</option>
            </select>
            <button id="shaderhud-apply">apply changes</button>
            <button id="shaderhud-revert">revert changes</button>
        </div>`);

    const shaderhud = document.getElementById('shaderhud');
    const selectel = document.getElementById('shaderhud-select');
    const applyel = document.getElementById('shaderhud-apply');
    const revertel = document.getElementById('shaderhud-revert');
    const texteditor = CodeMirror(shaderhud, {
        lineNumbers: true
      });
    const editorel = document.getElementsByClassName('CodeMirror')[0];

    editorel.hidden = true;
    applyel.hidden = true;
    revertel.hidden = true;

    const programdb = {};
    const shaderdb = {};

    const useProgram = gl.useProgram.bind(gl);
    gl.useProgram = (program) => {
        if (program.name in programdb) {
            useProgram(program);
            return;
        }
        const programentry = [];
        const shaders = gl.getAttachedShaders(program);
        for (const shader of shaders) {
            const isfrag = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.FRAGMENT_SHADER;
            const stageid = isfrag ? 'FS' : 'VS';
            const glslstring = gl.getShaderSource(shader);
            const shaderid = `${program.name} ${stageid} ${glslstring.length}`;
            const shaderentry = [program.name, shader, glslstring];
            programentry.push(shaderid);
            shaderdb[shaderid] = shaderentry;
            selectel.insertAdjacentHTML('beforeend', `
                <option value="${shaderid}">${shaderid}</option>
            `);
        }
        programdb[program.name] = programentry;
        useProgram(program);
    };
    selectel.onchange = (evt) => {
        const val = evt.target.value;
        if (val) {
            const glslstring = shaderdb[val][2];
            editorel.hidden = false;
            texteditor.setValue(glslstring);
        } else {
            editorel.hidden = true;
        }
    };
}

function shaderhud(canvas, gl) {
    const script = document.createElement('script');
    script.onload = () => create_shaderhud(canvas, gl);
    script.src = 'https://unpkg.com/codemirror@5.41.0/lib/codemirror.js';
    document.head.appendChild(script);

    var fileref = document.createElement('link');
    fileref.rel = 'stylesheet';
    fileref.type = 'text/css';
    fileref.href = 'https://unpkg.com/codemirror@5.41.0/lib/codemirror.css';
    document.head.appendChild(fileref)
}
