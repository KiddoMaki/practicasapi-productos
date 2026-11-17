// En GitHub Pages no hay servidor Express: apuntamos a la API desplegada en Render.
// Si se sirve desde el propio Express (mismo origen), se usa la ruta relativa.
const RENDER_API_URL = 'https://practicasapi-productos.onrender.com';
const API_BASE =
  (window.API_BASE_URL || (location.hostname.endsWith('github.io') ? RENDER_API_URL : '')).replace(/\/$/, '') +
  '/api/productos';

const state = {
  page: 1,
  limit: 100,
  totalPages: 0,
  next: null,
  prev: null,
  editingId: null,
};

const form = document.getElementById('producto-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const formMessage = document.getElementById('form-message');
const listMessage = document.getElementById('list-message');
const tbody = document.getElementById('productos-body');
const paginationInfo = document.getElementById('pagination-info');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const refreshBtn = document.getElementById('refresh-btn');

function setMessage(el, text, type = '') {
  el.textContent = text || '';
  el.className = 'message' + (type ? ` ${type}` : '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `Error ${res.status}`;
    const details = data?.error?.details ? ` (${data.error.details.join(', ')})` : '';
    throw new Error(msg + details);
  }
  return data;
}

async function loadProductos(page = state.page) {
  setMessage(listMessage, 'Cargando...', '');
  try {
    const data = await apiRequest(`${API_BASE}?page=${page}&limit=${state.limit}`);
    state.page = data.pagination.page;
    state.totalPages = data.pagination.totalPages;
    state.next = data.pagination.nextPage;
    state.prev = data.pagination.prevPage;
    renderProductos(data.data || []);
    paginationInfo.textContent = `Página ${data.pagination.page} de ${data.pagination.totalPages} · Total: ${data.pagination.total} · ${data.pagination.limit} por página`;
    prevBtn.disabled = !state.prev;
    nextBtn.disabled = !state.next;
    setMessage(listMessage, '', '');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5">No se pudieron cargar los productos.</td></tr>';
    setMessage(listMessage, err.message, 'error');
  }
}

function renderProductos(items) {
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay productos para mostrar.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria)}</td>
      <td>${Number(p.precio_venta_publico).toFixed(2)}</td>
      <td>
        <div class="row-actions">
          <button class="btn secondary" data-action="edit" data-id="${p.id}">Editar</button>
          <button class="btn danger" data-action="delete" data-id="${p.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFormData() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    categoria: document.getElementById('categoria').value.trim(),
    precio_venta_publico: Number(document.getElementById('precio_venta_publico').value),
  };
}

function resetForm() {
  state.editingId = null;
  form.reset();
  document.getElementById('producto-id').value = '';
  formTitle.textContent = 'Crear producto';
  submitBtn.textContent = 'Crear';
  cancelEditBtn.classList.add('hidden');
}

async function startEdit(id) {
  setMessage(formMessage, 'Cargando producto...', '');
  try {
    const data = await apiRequest(`${API_BASE}/${id}`);
    const p = data.data;
    state.editingId = p.id;
    document.getElementById('producto-id').value = p.id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('precio_venta_publico').value = Number(p.precio_venta_publico);
    formTitle.textContent = `Actualizar producto #${p.id}`;
    submitBtn.textContent = 'Actualizar';
    cancelEditBtn.classList.remove('hidden');
    setMessage(formMessage, 'Editando producto. Modifica los campos y guarda.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    setMessage(formMessage, err.message, 'error');
  }
}

async function deleteProducto(id) {
  const ok = confirm(`¿Eliminar el producto #${id}? Esta acción no se puede deshacer.`);
  if (!ok) return;
  setMessage(listMessage, 'Eliminando...', '');
  try {
    await apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' });
    setMessage(listMessage, `Producto #${id} eliminado.`, 'success');
    // si la página queda vacía y no es la primera, retroceder
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 1 && state.page > 1) {
      await loadProductos(state.page - 1);
    } else {
      await loadProductos(state.page);
    }
    if (state.editingId === id) resetForm();
  } catch (err) {
    setMessage(listMessage, err.message, 'error');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = getFormData();
  setMessage(formMessage, 'Guardando...', '');
  try {
    if (state.editingId) {
      await apiRequest(`${API_BASE}/${state.editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMessage(formMessage, `Producto #${state.editingId} actualizado.`, 'success');
      resetForm();
    } else {
      const data = await apiRequest(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(formMessage, `Producto creado con ID #${data.data.id}.`, 'success');
      form.reset();
    }
    await loadProductos(state.page);
  } catch (err) {
    setMessage(formMessage, err.message, 'error');
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
  setMessage(formMessage, 'Edición cancelada.', '');
});

prevBtn.addEventListener('click', () => {
  if (state.prev) loadProductos(state.page - 1);
});

nextBtn.addEventListener('click', () => {
  if (state.next) loadProductos(state.page + 1);
});

refreshBtn.addEventListener('click', () => loadProductos(state.page));

tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'edit') startEdit(id);
  if (btn.dataset.action === 'delete') deleteProducto(id);
});

loadProductos(1);
