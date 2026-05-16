const API = '/api/records';
const tableBody = document.querySelector('#recordsTable tbody');
const modal = document.getElementById('formModal');
const modalTitle = document.getElementById('modalTitle');
const recordIdInput = document.getElementById('recordId');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');

// Cargar registros
async function loadRecords() {
    try {
        const res = await fetch(API);
        const records = await res.json();
        tableBody.innerHTML = records.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>
                    <button class="btn primary action-btn" onclick="editRecord(${r.id}, '${r.name}', '${r.email}')">Editar</button>
                    <button class="btn secondary action-btn" onclick="deleteRecord(${r.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error('Error cargando:', err); }
}

// Abrir modal
document.getElementById('addBtn').onclick = () => {
    modalTitle.textContent = 'Nuevo Registro';
    recordIdInput.value = ''; nameInput.value = ''; emailInput.value = '';
    modal.classList.remove('hidden');
};
document.getElementById('cancelBtn').onclick = () => modal.classList.add('hidden');

// Guardar (Crear o Editar)
document.getElementById('saveBtn').onclick = async () => {
    const id = recordIdInput.value;
    const data = { name: nameInput.value, email: emailInput.value };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API}/${id}` : API;

    try {
        await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
        modal.classList.add('hidden');
        loadRecords();
    } catch (err) { alert('Error al guardar'); }
};

// Editar
window.editRecord = (id, name, email) => {
    modalTitle.textContent = 'Editar Registro';
    recordIdInput.value = id; nameInput.value = name; emailInput.value = email;
    modal.classList.remove('hidden');
};

// Eliminar
window.deleteRecord = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
        await fetch(`${API}/${id}`, { method: 'DELETE' });
        loadRecords();
    } catch (err) { alert('Error al eliminar'); }
};

loadRecords();