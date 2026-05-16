const API = '/api/records';
const tableBody = document.querySelector('#recordsTable tbody');
const modal = document.getElementById('formModal');
const modalTitle = document.getElementById('modalTitle');
const recordIdInput = document.getElementById('recordId');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

// Función segura para evitar inyección de HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

async function loadRecords() {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">⏳ Cargando...</td></tr>';
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error(`Servidor respondió ${res.status}`);
        const records = await res.json();
        
        tableBody.innerHTML = '';
        if (records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">No hay registros. Usa "+ Nuevo Registro" para comenzar.</td></tr>';
            return;
        }

        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.email)}</td>
                <td>
                    <button class="btn primary action-btn" data-action="edit" data-id="${r.id}">Editar</button>
                    <button class="btn secondary action-btn" data-action="delete" data-id="${r.id}">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error en loadRecords:', err);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e11d48; padding:20px;">❌ Error: ${err.message}<br>Revisa la consola (F12) o los Logs de Render.</td></tr>`;
    }
}

// Modal: Nuevo
addBtn.onclick = () => {
    modalTitle.textContent = 'Nuevo Registro';
    recordIdInput.value = '';
    nameInput.value = '';
    emailInput.value = '';
    modal.classList.remove('hidden');
};
cancelBtn.onclick = () => modal.classList.add('hidden');

// Modal: Guardar
saveBtn.onclick = async () => {
    const id = recordIdInput.value;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) return alert('Completa nombre y correo');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API}/${id}` : API;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Error del servidor');
        }
        modal.classList.add('hidden');
        loadRecords();
    } catch (err) {
        alert(`❌ ${err.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
    }
};

// Delegación de eventos (Edit/Delete)
tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        if (!confirm('¿Eliminar este registro permanentemente?')) return;
        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('No se pudo eliminar');
            loadRecords();
        } catch (err) { alert(`❌ ${err.message}`); }
    } 
    else if (action === 'edit') {
        modalTitle.textContent = 'Editar Registro';
        recordIdInput.value = id;
        nameInput.value = '...';
        emailInput.value = '...';
        modal.classList.remove('hidden');
        
        try {
            const res = await fetch(`${API}/${id}`);
            if (!res.ok) throw new Error('Registro no encontrado');
            const record = await res.json();
            nameInput.value = record.name;
            emailInput.value = record.email;
        } catch (err) {
            alert('Error al cargar datos para editar');
            modal.classList.add('hidden');
        }
    }
});

// Cargar al iniciar
loadRecords();