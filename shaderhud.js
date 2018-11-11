function create_program(gl, vname, vsource, fname, fsource) {
    const prog = gl.createProgram();

    const vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vsource);
    gl.compileShader(vshader);
    let message = gl.getShaderInfoLog(vshader);
    if (message.length > 0) {
        console.warn(`${message}\nwhile compiling [${vname}]`);
    }
    gl.attachShader(prog, vshader);

    const fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fsource);
    gl.compileShader(fshader);
    message = gl.getShaderInfoLog(fshader);
    if (message.length > 0) {
        console.warn(`${message}\nwhile compiling [${fname}]`);
    }
    gl.attachShader(prog, fshader);

    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        return null;
    }
    console.info(`Success compiling [${vname}] and [${fname}].`);
    return prog;
}

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
            const programentry = programdb[program.name];
            useProgram(programentry.replaced_program);
            return;
        }
        const programentry = {
            shaderids: [],
            original_program: program,
            replaced_program: program,
        };
        const shaders = gl.getAttachedShaders(program);
        for (const shader of shaders) {
            const isfrag = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.FRAGMENT_SHADER;
            const stageid = isfrag ? 'FS' : 'VS';
            const glslstring = gl.getShaderSource(shader);
            const shaderid = `${program.name} ${stageid} ${glslstring.length}`;
            const shaderentry = {
                program: program,
                shader: shader,
                original: glslstring,
                applied: glslstring,
            };
            programentry.shaderids.push(shaderid);
            shaderdb[shaderid] = shaderentry;
            selectel.insertAdjacentHTML('beforeend',
                `<option value="${shaderid}">${shaderid}</option>`);
        }
        programdb[program.name] = programentry;
        useProgram(programentry.replaced_program);
    };
    const updatebuttons = () => {
        const shaderentry = shaderdb[selectel.value];
        applyel.hidden = texteditor.getValue() === shaderentry.applied;
        revertel.hidden = shaderentry.applied === shaderentry.original;
    };
    const recompileshaders = () => {
        const programentry = programdb[shaderdb[selectel.value].program.name];
        const shaderid0 = programentry.shaderids[0];
        const shaderid1 = programentry.shaderids[1];
        const source0 = shaderdb[shaderid0].applied;
        const source1 = shaderdb[shaderid1].applied;
        const progobj = create_program(gl, shaderid0, source0, shaderid1, source1);
        if (progobj) {
            programentry.replaced_program = progobj;
        }
    };
    applyel.addEventListener('click', () => {
        const shaderentry = shaderdb[selectel.value];
        shaderentry.applied = texteditor.getValue();
        updatebuttons();
        recompileshaders();
    });
    revertel.addEventListener('click', () => {
        const shaderentry = shaderdb[selectel.value];
        shaderentry.applied = shaderentry.original;
        texteditor.setValue(shaderentry.applied);
        updatebuttons();
        const programentry = programdb[shaderentry.program.name];
        programentry.replaced_program = programentry.original_program;
    });
    texteditor.on('change', () => updatebuttons());
    selectel.onchange = (evt) => {
        const val = evt.target.value;
        if (val) {
            editorel.hidden = false;
            texteditor.setValue(shaderdb[val].applied);
            updatebuttons();
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

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://unpkg.com/codemirror@5.41.0/lib/codemirror.css';
    document.head.appendChild(link)
}
