class ProyectosManager {
    constructor(url) {
        this.url = url;
    }

    async cargarJSON() {
        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error(`Error al cargar el JSON: ${response.statusText}`);
        }
        return await response.json();
    }

    buscarRegistroPorCodigo(data, codigo) {
        return data.find(registro => registro.Código === codigo);
    }

    mostrarContenidoRegistro(registro, mostrarCampos = false, campos = []) {
        if (!registro) {
            document.body.innerHTML += '<p>No hay registro para mostrar.</p>';
            return;
        }

        let contenido = '<div class="container mt-4"><h2>Contenido del Registro</h2><ul class="list-group">';
        
        for (const [key, value] of Object.entries(registro)) {
            if (mostrarCampos && campos.includes(key)) {
                contenido += `<li class="list-group-item"><strong>${key}:</strong> ${this.formatearValor(key, value)}</li>`;
            } else if (!mostrarCampos) {
                contenido += `<li class="list-group-item"><strong>${key}:</strong> ${this.formatearValor(key, value)}</li>`;
            }
        }
        contenido += '</ul></div>';
        document.body.innerHTML += contenido;
    }

    formatearValor(key, value) {
        // Verificar si el valor es un objeto
        if (typeof value === 'object' && value !== null) {
            return this.formatearObjeto(value);
        } else if (Array.isArray(value)) {
            return value.map(item => this.formatearValor(key, item)).join(', ');
        } else if (typeof value === 'number') {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
        }
        return value;
    }

    formatearObjeto(obj) {
        const etiqueta = Array.isArray(obj) ? 'ol' : 'ul';
        // Formatear un objeto como una lista
        return `<${etiqueta}>${Object.entries(obj).map(([key, value]) => `<li>${etiqueta === 'ol' ?'':`<strong>${key}:</strong>`} ${this.formatearValor(key, value)}</li>`).join('')}</${etiqueta}>`;
    }

    async generarTabla(titulo, campos) {
        const datos = await this.cargarJSON();
        let tabla = `
            <div class="container mt-4">
                <h2>${titulo}</h2>
                <table class="table table-striped">
                    <thead>
                        <tr>${campos.map(campo => `<th>${campo}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
        `;

        datos.forEach(registro => {
            const fila = campos.map(campo => `<td>${this.formatearValor(campo, registro[campo])}</td>`).join('');
            tabla += `<tr>${fila}</tr>`;
        });

        tabla += `
                    </tbody>
                </table>
            </div>
        `;
        document.body.innerHTML += tabla;
    }

    async main(codigoBuscado, mostrarCampos = false, campos = []) {
        try {
            const datos = await this.cargarJSON();
            const registro = this.buscarRegistroPorCodigo(datos, codigoBuscado);
            this.mostrarContenidoRegistro(registro, mostrarCampos, campos);
        } catch (error) {
            console.error(error);
        }
    }

    generarINPUTS(registro, enBlanco=false) {
        let formulario ='', valor;
        if (!registro) return'';
        for (const [key, value] of Object.entries(registro)) {
            // Ignorar el campo "Código"
            if (key === 'Código') {
                continue;
            }
    
            // Si es un array de objetos
            if (Array.isArray(value) && value.every(item => typeof item === 'object')) {
                formulario += this.generarSeccionArray(key, value);
            } else if (typeof value === 'string' && value.length > 100) {
                valor = enBlanco ? '' : value;
                formulario += `
                    <div class="mb-3">
                        <label for="${key}" class="form-label">${key}</label>
                        <textarea class="form-control" id="${key}" name="${key}" rows="3">${valor}</textarea>
                    </div>
                `;
            } else {
                valor = enBlanco ? '' : value;
                formulario += `
                    <div class="mb-3">
                        <label for="${key}" class="form-label">${key}</label>
                        <input type="text" class="form-control" id="${key}" name="${key}" value="${valor}" />
                    </div>
                `;
            }
        }
        return formulario;
    }

    generarFormulario(registro) {
        if (!registro) {
            document.body.innerHTML += '<p>No hay registro para mostrar en el formulario.</p>';
            return;
        }

        const codigo = registro['Código'] || 'Desconocido';
        let formulario = `<div class="container mt-4"><h2>Formulario del Registro ${codigo}</h2><form>`;
        
        formulario += this.generarINPUTS(registro);
    
        formulario += `
            <button type="submit" class="btn btn-primary">Enviar</button>
            </form></div>
        `;
    
        document.body.innerHTML += formulario;
    }
    
    generarSeccionArray(key, array) {
        let seccion = `
        <div class="modal" id="modal-${key}">
            <div class="modal-dialog">
            <div class="modal-content">
                <form>
                <div class="modal-header">
                <h4 class="modal-title">${key}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${this.generarINPUTS(array[0], true)}
                </div>
                <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Guardar</button>
                </div>
                </form>
            </div>
            </div>
        </div>`;

        seccion += `<div class="mb-3"><label class="form-label">${key}</label> <button class="btn btn-success btn-sm"  data-bs-toggle="modal" data-bs-target="#modal-${key}" onclick="this.action='Crear"><i class="bi bi-plus"></i></button><ul class="list-group">`;
    
        array.forEach((item, index) => {
    
            seccion += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${this.formatearObjeto(item)}
                    <div>
                        <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modal-${key}" onclick="editarElemento('${key}', ${index})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="confirm('Elimina ${key}')"><i class="bi bi-x"></i></button>
                    </div>
                </li>
            `;
        });
    
        seccion += `
            </ul>
            </div>
        `;
    
        return seccion;
    }

    async mainForm(codigoBuscado) {
        try {
            const datos = await this.cargarJSON();
            const registro = this.buscarRegistroPorCodigo(datos, codigoBuscado);
            this.generarFormulario(registro);
        } catch (error) {
            console.error(error);
        }
    }

    async checkFields (oForm) {
        const datos = await this.cargarJSON();
        const fields = Object.keys(datos[0]);
        const arrayChk = fields.map((field) => `<div class="form-check">
            <input type="checkbox" class="form-check-input" id="${field}" name="${field}" value="${field}">
            <label class="form-check-label" for="${field}">${field}</label>
        </div>`);
        oForm.innerHTML+=arrayChk.join('');
        const boton = `<button type="submit" class="btn btn-primary">Enviar</button>`;
        oForm.innerHTML+=boton;
    }
    
}
    // Funciones para manejar agregar, editar y eliminar elementos
function agregarElemento(key) {
        // Lógica para abrir un modal y agregar un nuevo elemento
}
    
function editarElemento(key, index) {
        // Lógica para abrir un modal y editar el elemento existente
}
    
function eliminarElemento(key, index) {
        // Lógica para eliminar el elemento del arreglo
}
