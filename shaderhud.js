function dump_program_state(gl, prog) {
    const nblocks = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORM_BLOCKS);
    const ubindings = [];
    for (let blocki = 0; blocki < nblocks; ++blocki) {
        const binding = gl.getActiveUniformBlockParameter(prog, blocki, gl.UNIFORM_BLOCK_BINDING);
        const name = gl.getActiveUniformBlockName(prog, blocki);
        console.info('    ' + name + ' ' + binding);
        ubindings.push(binding);
    }

    const nattribs = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORM_BLOCKS);
    for (let attribi = 0; attribi < nattribs; ++attribi) {
        const info = gl.getActiveAttrib(prog, attribi);
        const loc = gl.getAttribLocation(prog, info.name);
        console.info('    ' + info.name + ' ' + info.size  + ' ' + info.type + ' ' + loc);
    }

    return ubindings;
}

function recompile_program(gl, prog, vname, vsource, fname, fsource) {

    const bindings = dump_program_state(gl, prog);

    const prevshaders = gl.getAttachedShaders(prog);
    gl.detachShader(prog, prevshaders[0]);
    gl.detachShader(prog, prevshaders[1]);

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
        return false;
    }

    const nblocks = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORM_BLOCKS);
    if (nblocks != bindings.length)  {
        console.error('Unexpected change in bindings.');
    } else {
        for (let blocki = 0; blocki < nblocks; ++blocki) {
            gl.uniformBlockBinding(prog, blocki, bindings[blocki]);
        }
    }

    console.info('after:');
    dump_program_state(gl, prog);

    console.info(`Success compiling [${vname}] and [${fname}].`);
    return true;
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
            useProgram(program);
            return;
        }
        const programentry = {
            shaderids: [],
            programobj: program
        };
        const shaders = gl.getAttachedShaders(program);
        for (const shader of shaders) {
            const isfrag = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.FRAGMENT_SHADER;
            const stageid = isfrag ? 'FS' : 'VS';
            const glslstring = gl.getShaderSource(shader);
            const shaderid = `${program.name} ${stageid} ${glslstring.length}`;
            const shaderentry = {
                programobj: program,
                original_shaderobj: shader,
                replaced_shaderobj: shader,
                original_string: glslstring,
                applied_string: glslstring,
            };
            programentry.shaderids.push(shaderid);
            shaderdb[shaderid] = shaderentry;
            selectel.insertAdjacentHTML('beforeend',
                `<option value="${shaderid}">${shaderid}</option>`);
        }
        programdb[program.name] = programentry;
        useProgram(program);
    };
    const updatebuttons = () => {
        const shaderentry = shaderdb[selectel.value];
        applyel.hidden = texteditor.getValue() === shaderentry.applied_string;
        revertel.hidden = shaderentry.applied_string === shaderentry.original_string;
    };
    const recompileshaders = () => {
        const shaderentry = shaderdb[selectel.value];
        const programentry = programdb[shaderentry.programobj.name];
        const shaderid0 = programentry.shaderids[0];
        const shaderid1 = programentry.shaderids[1];
        const source0 = shaderdb[shaderid0].applied_string;
        const source1 = shaderdb[shaderid1].applied_string;
        recompile_program(gl, shaderentry.programobj, shaderid0, source0, shaderid1, source1);
    };
    applyel.addEventListener('click', () => {
        const shaderentry = shaderdb[selectel.value];
        shaderentry.applied_string = texteditor.getValue();
        updatebuttons();
        recompileshaders();
    });
    revertel.addEventListener('click', () => {
        const shaderentry = shaderdb[selectel.value];
        shaderentry.applied_string = shaderentry.original_string;
        texteditor.setValue(shaderentry.applied_string);
        updatebuttons();
        recompileshaders();
    });
    texteditor.on('change', () => updatebuttons());
    selectel.onchange = (evt) => {
        const val = evt.target.value;
        if (val) {
            editorel.hidden = false;
            texteditor.setValue(shaderdb[val].applied_string);
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
