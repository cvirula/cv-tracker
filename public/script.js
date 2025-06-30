// Variables globales
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const searchBtn = document.getElementById('searchBtn');
const dpiSearch = document.getElementById('dpiSearch');
const searchResults = document.getElementById('searchResults');
const clientInfo = document.getElementById('clientInfo');
const adminPanel = document.getElementById('adminPanel');
const addClientForm = document.getElementById('addClientForm');
const addUserForm = document.getElementById('addUserForm');
const clientsList = document.getElementById('clientsList');
const usersList = document.getElementById('usersList');
const clientsViewList = document.getElementById('clientsViewList');
const editModal = document.getElementById('editModal');
const editClientForm = document.getElementById('editClientForm');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    if (authToken) {
        // Verificar si el token es válido
        fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                showMainScreen();
            } else {
                logout();
            }
        })
        .catch(() => {
            logout();
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', logout);
    
    // Búsqueda
    searchBtn.addEventListener('click', searchClient);
    dpiSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchClient();
        }
    });
    
    // Formularios de admin (solo se configuran si el usuario es admin)
    if (addClientForm) {
        addClientForm.addEventListener('submit', handleAddClient);
    }
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    if (editClientForm) {
        editClientForm.addEventListener('submit', handleEditClient);
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainScreen();
            showNotification('Inicio de sesión exitoso', 'success');
        } else {
            showLoginError(data.error);
        }
    } catch (error) {
        showLoginError('Error de conexión');
    }
}

// Mostrar pantalla principal
function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    
    if (currentUser) {
        // Mostrar nombre del usuario
        currentUserSpan.textContent = `Bienvenido, ${currentUser.username}`;
        
        // Cargar lista de clientes para todos los usuarios
        loadClientsViewList();
        
        // Ocultar completamente el panel de administración para usuarios normales
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        
        // Solo mostrar panel de administración si es admin
        if (currentUser.es_admin) {
            if (adminPanel) {
                adminPanel.style.display = 'block';
                loadClientsList();
                loadUsersList();
            }
        } else {
            // Para usuarios normales, asegurar que el panel esté oculto
            if (adminPanel) {
                adminPanel.style.display = 'none';
            }
            // Limpiar cualquier contenido del panel de admin que pudiera estar visible
            if (clientsList) {
                clientsList.innerHTML = '';
            }
            if (usersList) {
                usersList.innerHTML = '';
            }
        }
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    mainScreen.classList.remove('active');
    loginScreen.classList.add('active');
    
    // Limpiar formularios
    loginForm.reset();
    loginError.textContent = '';
    searchResults.style.display = 'none';
    
    // Ocultar panel de administración
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    
    // Limpiar lista de clientes
    if (clientsViewList) {
        clientsViewList.innerHTML = '';
    }
}

// Mostrar error de login
function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Buscar cliente
async function searchClient() {
    const dpi = dpiSearch.value.trim();
    
    if (!dpi) {
        showNotification('Por favor ingrese un DPI', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/clientes/${dpi}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayClientInfo(data);
            searchResults.style.display = 'block';
            searchResults.classList.add('fade-in');
        } else {
            showNotification(data.error || 'Cliente no encontrado', 'error');
            searchResults.style.display = 'none';
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Mostrar información del cliente
function displayClientInfo(cliente) {
    const fechaCreacion = new Date(cliente.fecha_creacion).toLocaleDateString('es-GT');
    const fechaActualizacion = new Date(cliente.fecha_actualizacion).toLocaleDateString('es-GT');
    
    clientInfo.innerHTML = `
        <div class="client-info">
            <div class="info-item">
                <span class="info-label">DPI</span>
                <span class="info-value">${cliente.dpi}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Nombre</span>
                <span class="info-value">${cliente.nombre}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Cantidad de Deuda</span>
                <span class="info-value">Q${parseFloat(cliente.cantidad_deuda).toFixed(2)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Empresa</span>
                <span class="info-value">${cliente.empresa_deuda}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha de Registro</span>
                <span class="info-value">${fechaCreacion}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Última Actualización</span>
                <span class="info-value">${fechaActualizacion}</span>
            </div>
        </div>
    `;
}

// Cargar lista de clientes para todos los usuarios (solo lectura)
async function loadClientsViewList() {
    try {
        // Intentar primero la ruta normal
        let response = await fetch('/api/clientes/view', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        let clientes = await response.json();
        if (response.ok && Array.isArray(clientes) && clientes.length > 0) {
            displayClientsViewList(clientes);
            return;
        }
        // Si falla, intentar la ruta de admin (puede devolver 403)
        response = await fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        clientes = await response.json();
        if (response.ok && Array.isArray(clientes) && clientes.length > 0) {
            displayClientsViewList(clientes);
            return;
        }
        // Si todo falla, mostrar mensaje
        clientsViewList.innerHTML = '<p>No se pudo cargar la lista de clientes. Contacta al administrador.</p>';
    } catch (error) {
        clientsViewList.innerHTML = '<p>No se pudo cargar la lista de clientes. Contacta al administrador.</p>';
    }
}

// Mostrar lista de clientes para todos los usuarios (solo lectura)
function displayClientsViewList(clientes) {
    console.log("Respuesta de /api/clientes/view:", clientes);
    if (!clientsViewList) return;
    if (clientes && !Array.isArray(clientes)) {
        clientes = [clientes];
    }
    if (!Array.isArray(clientes) || clientes.length === 0) {
        clientsViewList.innerHTML = '<p>No hay clientes registrados</p>';
        return;
    }
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>DPI</th>
                    <th>Nombre</th>
                    <th>Deuda</th>
                    <th>Empresa</th>
                    <th>Fecha de Registro</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(cliente => {
                    const fecha = new Date(cliente.fecha_creacion).toLocaleDateString('es-GT');
                    return `
                        <tr>
                            <td>${cliente.dpi}</td>
                            <td>${cliente.nombre}</td>
                            <td>Q${parseFloat(cliente.cantidad_deuda).toFixed(2)}</td>
                            <td>${cliente.empresa_deuda}</td>
                            <td>${fecha}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    clientsViewList.innerHTML = tableHTML;
}

// Agregar cliente (solo admin)
async function handleAddClient(e) {
    e.preventDefault();
    
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const formData = {
        dpi: document.getElementById('newDpi').value.trim(),
        nombre: document.getElementById('newNombre').value.trim(),
        cantidad_deuda: parseFloat(document.getElementById('newCantidad').value),
        empresa_deuda: document.getElementById('newEmpresa').value.trim()
    };
    
    try {
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Cliente agregado exitosamente', 'success');
            addClientForm.reset();
            loadClientsList();
            loadClientsViewList(); // Actualizar también la vista para todos
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Crear usuario (solo admin)
async function handleAddUser(e) {
    e.preventDefault();
    
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const formData = {
        username: document.getElementById('newUsername').value.trim(),
        password: document.getElementById('newUserPassword').value
    };
    
    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Usuario creado exitosamente', 'success');
            addUserForm.reset();
            loadUsersList();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Cargar lista de clientes (solo admin)
async function loadClientsList() {
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        return;
    }
    
    try {
        const response = await fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const clientes = await response.json();
        
        if (response.ok) {
            displayClientsList(clientes);
        } else {
            showNotification('Error al cargar la lista de clientes', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Mostrar lista de clientes (solo admin)
function displayClientsList(clientes) {
    if (!currentUser || !currentUser.es_admin || !clientsList) {
        return;
    }
    
    if (clientes.length === 0) {
        clientsList.innerHTML = '<p>No hay clientes registrados</p>';
        return;
    }
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>DPI</th>
                    <th>Nombre</th>
                    <th>Deuda</th>
                    <th>Empresa</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(cliente => {
                    const fecha = new Date(cliente.fecha_creacion).toLocaleDateString('es-GT');
                    return `
                        <tr>
                            <td>${cliente.dpi}</td>
                            <td>${cliente.nombre}</td>
                            <td>Q${parseFloat(cliente.cantidad_deuda).toFixed(2)}</td>
                            <td>${cliente.empresa_deuda}</td>
                            <td>${fecha}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-primary" onclick="editClient(${cliente.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="deleteClient(${cliente.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    clientsList.innerHTML = tableHTML;
}

// Cargar lista de usuarios (solo admin)
async function loadUsersList() {
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        return;
    }
    
    try {
        const response = await fetch('/api/usuarios', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const usuarios = await response.json();
        
        if (response.ok) {
            displayUsersList(usuarios);
        } else {
            showNotification('Error al cargar la lista de usuarios', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Mostrar lista de usuarios (solo admin)
function displayUsersList(usuarios) {
    if (!currentUser || !currentUser.es_admin || !usersList) {
        return;
    }
    
    if (usuarios.length === 0) {
        usersList.innerHTML = '<p>No hay usuarios registrados</p>';
        return;
    }
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Tipo</th>
                    <th>Fecha de Creación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${usuarios.map(usuario => {
                    const fecha = new Date(usuario.fecha_creacion).toLocaleDateString('es-GT');
                    const isCurrentUser = usuario.id === currentUser.id;
                    const badge = usuario.es_admin ? 
                        '<span class="admin-badge-small"><i class="fas fa-crown"></i>Admin</span>' : 
                        '<span class="user-badge"><i class="fas fa-user"></i>Usuario</span>';
                    
                    return `
                        <tr>
                            <td>${usuario.username}</td>
                            <td>${badge}</td>
                            <td>${fecha}</td>
                            <td>
                                <div class="action-buttons">
                                    ${!usuario.es_admin ? `
                                        <button class="btn btn-sm btn-secondary" onclick="deleteUser(${usuario.id}, '${usuario.username}')" ${isCurrentUser ? 'disabled' : ''}>
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : `
                                        <span style="color: #999; font-size: 0.8rem;">No se puede eliminar</span>
                                    `}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    usersList.innerHTML = tableHTML;
}

// Eliminar usuario (solo admin)
async function deleteUser(id, username) {
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Verificar que no se esté eliminando a sí mismo
    if (id === currentUser.id) {
        showNotification('No puedes eliminar tu propia cuenta', 'error');
        return;
    }
    
    if (!confirm(`¿Está seguro de que desea eliminar al usuario "${username}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Usuario eliminado exitosamente', 'success');
            loadUsersList();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Editar cliente (solo admin)
async function editClient(id) {
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/clientes/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const cliente = await response.json();
        
        if (response.ok) {
            document.getElementById('editClientId').value = cliente.id;
            document.getElementById('editDpi').value = cliente.dpi;
            document.getElementById('editNombre').value = cliente.nombre;
            document.getElementById('editCantidad').value = cliente.cantidad_deuda;
            document.getElementById('editEmpresa').value = cliente.empresa_deuda;
            
            editModal.style.display = 'block';
        } else {
            showNotification('Error al cargar datos del cliente', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Manejar edición de cliente (solo admin)
async function handleEditClient(e) {
    e.preventDefault();
    
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const id = document.getElementById('editClientId').value;
    const formData = {
        dpi: document.getElementById('editDpi').value.trim(),
        nombre: document.getElementById('editNombre').value.trim(),
        cantidad_deuda: parseFloat(document.getElementById('editCantidad').value),
        empresa_deuda: document.getElementById('editEmpresa').value.trim()
    };
    
    try {
        const response = await fetch(`/api/clientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Cliente actualizado exitosamente', 'success');
            closeEditModal();
            loadClientsList();
            loadClientsViewList(); // Actualizar también la vista para todos
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Eliminar cliente (solo admin)
async function deleteClient(id) {
    // Verificar que el usuario sea admin
    if (!currentUser || !currentUser.es_admin) {
        showNotification('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    if (!confirm('¿Está seguro de que desea eliminar este cliente?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Cliente eliminado exitosamente', 'success');
            loadClientsList();
            loadClientsViewList(); // Actualizar también la vista para todos
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Cerrar modal de edición
function closeEditModal() {
    editModal.style.display = 'none';
    editClientForm.reset();
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Función global para cerrar modal
window.closeEditModal = closeEditModal; 