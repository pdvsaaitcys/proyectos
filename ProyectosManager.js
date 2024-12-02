class ProyectosManager {
    constructor(url) {
        this.url = url+'.txt';
        this.data = [];
        this.pos = -1;
        this.mean = [];
    }

    async cargarJSON() {
        if (this.data.length === 0) {
            const response = await fetch(this.url);
            console.log({response});
            if (!response.ok) {
                throw new Error(`Error al cargar el JSON: ${response.statusText}`);
            }
            return await decrypt_data(response).json();
        }   else    {
            return this.data;
        }
    }

    buscarRegistroPorCodigo(codigo) {
        this.data.forEach((registro, i) => {
            if (registro.Código === codigo) {
                this.pos = i;
            }
        })
        return this.pos >= 0 ? this.data[this.pos] : null;
    }

    mostrarContenidoRegistro(registro, id, mostrarCampos = false, campos = []) {
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
        document.getElementById(id).innerHTML=contenido;
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

    async generarTabla(titulo, campos, id) {
        this.data = await this.cargarJSON();
        let tabla = `
            <div class="container mt-4">
                <h2>${titulo}</h2>
                <table class="table table-striped">
                    <thead>
                        <tr>${campos.map(campo => `<th>${campo}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
        `;

        this.data.forEach(registro => {
            const fila = campos.map(campo => `<td>${this.formatearValor(campo, registro[campo])}</td>`).join('');
            tabla += `<tr>${fila}</tr>`;
        });

        tabla += `
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById(id).innerHTML=tabla;
    }

    async mostrarFicha(codigoBuscado, id, mostrarCampos = false, campos = []) {
        try {
            this.data = await this.cargarJSON();
            const registro = this.buscarRegistroPorCodigo(codigoBuscado);
            this.mostrarContenidoRegistro(registro, id, mostrarCampos, campos);
        } catch (error) {
            console.error(error);
        }
    }

    generarINPUTS(fuente, registro, enBlanco=false) {
        let pos = 0;
        let item;
        let formulario ='', valor;
        if (!registro) return'';
        for (const [key, value] of Object.entries(registro)) {
            // Ignorar el campo "Código"
            if (key === 'Código') {
                continue;
            }
    
            item = {id:fuente.id+'_'+pos, json:fuente.json+`["${key}"]`};
            // Si es un array de objetos
            if (Array.isArray(value) && value.every(item => typeof item === 'object')) {
                formulario += this.generarSeccionArray(item,key, value);
            } else if (Array.isArray(value)) {
                formulario += `<div class="mb-2"><label class="form-label">${key}</label><ol class="list-group">`;
                formulario += value.map((v, i) => {
                    item = {id:`${fuente.id}_${pos}_${i}`,json:`${fuente.json}["${key}"][${i}]`};
                    this.mean.push(item);
                    return `<li class="list-group-item">
                    <div class="input-group">
                        <span class="input-group-text">${i+1}</span>
                        <input type="text" class="form-control" id="${item.id}" name="${item.id}" value="${v}" data-fuente="${fuente}" />
                    </div>
                    </li>`
                }).join('');
                formulario+='</ol>';
            } else if (typeof value === 'string' && value.length > 100) {
                this.mean.push(item);
                valor = enBlanco ? '' : value;
                formulario += `
                    <div class="input-group mb-2">
                        <span class="input-group-text">${key}</span>
                        <textarea class="form-control" id="${item.id}" name="${item.id}" rows="3" data-fuente="${fuente}">${valor}</textarea>
                    </div>
                `;
            } else {
                this.mean.push(item);
                valor = enBlanco ? '' : value;
                formulario += `
                <div class="input-group mb-2">
                    <span class="input-group-text">${key}</span>
                    <input type="text" class="form-control" id="${item.id}" name="${item.id}" value="${valor}" data-fuente="${fuente}" />
                    </div>
                `;
            }
            pos++;
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
        
        formulario += this.generarINPUTS({id:'', json:`this.data[${this.pos}]`},registro);
    
        formulario += `
            <button type="submit" class="btn btn-primary">Guardar</button>
            </form></div>
        `;
    
        document.body.innerHTML += formulario;
        // Selecciona el primer formulario en el documento
        const oForm = document.querySelector('form');

        oForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Previene el envío del formulario

            // Aquí puedes ejecutar la función que desees
            this.updateRegistro();
        });

    }
    
    generarSeccionArray(fuente, key, array) {
        let seccion='';
        let elemento;
        if (array.length>0) {
            seccion += `<div class="mb-2"><label class="form-label">${key}</label><ul class="list-group">`;
            let pos = 0;
            array.forEach((item, index) => {
                elemento = {id:`${fuente.id}_${pos}`,json:`${fuente.json}[${index}]`};
                seccion += `
                    <li class="list-group-item">
                        ${this.generarINPUTS(elemento,item)}
                    </li>
                `;
                pos++;
            });        
            seccion += `
                </ul>
                </div>
            `;
        }
    
        return seccion;
    }

    async mainForm(codigoBuscado) {
        try {
            this.data = await this.cargarJSON();
            const registro = this.buscarRegistroPorCodigo(codigoBuscado);
            this.generarFormulario(registro);
        } catch (error) {
            console.error(error);
        }
    }

    async checkFields (oForm) {
        this.data = await this.cargarJSON();
        const fields = Object.keys(this.data[0]);
        const arrayChk = fields.map((field) => `<div class="form-check">
            <input type="checkbox" class="form-check-input" id="${field}" name="${field}" value="${field}">
            <label class="form-check-label" for="${field}">${field}</label>
        </div>`);
        oForm.innerHTML+=arrayChk.join('');
        const boton = `<button type="submit" class="btn btn-primary">Enviar</button>`;
        oForm.innerHTML+=boton;
    }

    async updateRegistro() {
        this.mean.forEach((v) => {
            const obj = document.getElementById(v.id);
            if (obj) { // Verifica si el elemento existe
                eval(`${v.json} = '${obj.value}';`);
            } else {
                console.warn(`Elemento con id ${v.id} no encontrado.`);
            }
        });
        
        const token = letras.join('');
        const owner = 'pdvsaaitcys';
        const repo = 'proyectos';
        const path = this.url.split('/').pop();
    
        try {
            // Obtener el SHA del archivo existente
            const getFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!getFileResponse.ok) {
                throw new Error(`Error al obtener el archivo: ${getFileResponse.statusText}`);
            }
    
            const fileData = await getFileResponse.json();
            const sha = fileData.sha; // Obtener el SHA del archivo
    
            const datos = this.data;
            const content = encrypt_data(JSON.stringify(datos, null, 2));
            
            // Usar TextEncoder para codificar el contenido
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Hacer la solicitud a la API de GitHub para actualizar el archivo
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}.txt`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Añadiendo archivo JSON',
                    content: encodedContent,
                    sha: sha // Incluir el SHA del archivo existente
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al guardar el JSON: ${response.statusText}, ${JSON.stringify(errorData)}`);
            }
    
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
