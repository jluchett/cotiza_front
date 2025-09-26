document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const API_URL = 'https://cotiza-back.onrender.com/api'; // Reemplazar con tu URL de Render
    let clientes = [];
    let items = [];
    let cotizaciones = [];
    let itemTypes = [];
    
    // Elementos del DOM
    const cotizacionForm = document.getElementById('cotizacion-form');
    const clienteSelect = document.getElementById('cliente');
    const itemsContainer = document.querySelector('.items-container');
    const addItemBtn = document.getElementById('add-item');
    const summaryItems = document.getElementById('summary-items');
    const totalAmount = document.getElementById('total-amount');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const cotizacionesList = document.getElementById('cotizaciones-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const modal = document.getElementById('cotizacion-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const downloadPdfBtn = document.getElementById('download-pdf');
    
    const itemModal = document.getElementById('item-modal');
    const itemForm = document.getElementById('item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemDescriptionInput = document.getElementById('item-description');
    const itemPriceInput = document.getElementById('item-price');
    const itemTypeSelect = document.getElementById('item-type');
    const itemIdInput = document.getElementById('item-id');
    const itemModalTitle = document.getElementById('item-modal-title');

    // Variables globales adicionales para clientes
    const clienteModal = document.getElementById('cliente-modal');
    const clienteForm = document.getElementById('cliente-form');
    const clienteNombreInput = document.getElementById('cliente-nombre');

    const btnEditCliente = document.getElementById('btn-edit-cliente');
    const btnEditItem = document.getElementById('btn-edit-item');
    const clienteIdInput = document.getElementById('cliente-id');
    const clienteModalTitle = document.getElementById('cliente-modal-title');

    let currentCotizacionId = null;
    
    // Inicializar la aplicación
    init();
    
    // Funciones
    async function init() {
        await fetchClientes();
        await fetchItems();
        await fetchCotizaciones();
        await fetchItemTypes(); // ← Nueva función
        setupEventListeners();
        renderClientesSelect();
        renderItemsSelect();
        renderCotizacionesList();
        renderItemTypesSelect(); // ← Nueva función
        addItemRow();
    }
    
    function setupEventListeners() {
        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Formulario de cotización
        cotizacionForm.addEventListener('submit', handleSubmitCotizacion);
        
        // Agregar item
        addItemBtn.addEventListener('click', addItemRow);
        
        // Buscar cotizaciones
        searchBtn.addEventListener('click', searchCotizaciones);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchCotizaciones();
        });
        
        // Modal
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Descargar PDF
        downloadPdfBtn.addEventListener('click', downloadPDF);

        // Botón para abrir modal de nuevo item
        document.getElementById('btn-add-item').addEventListener('click', openItemModal);
        
        // Formulario de item
        itemForm.addEventListener('submit', handleItemSubmit);

        // Cerrar modal al hacer click en cancelar
        document.querySelector('[data-modal="item-modal"].btn-secondary').addEventListener('click', () => {
            cerrarModal('item-modal');
        });
        
        // Cerrar modal con la X
        document.querySelector('[data-modal="item-modal"].close-modal').addEventListener('click', () => {
            cerrarModal('item-modal');
        });

        // Botón para abrir modal de nuevo cliente
        document.getElementById('btn-add-cliente').addEventListener('click', openClienteModal);
        
        // Formulario de cliente
        clienteForm.addEventListener('submit', handleClienteSubmit);
        
        // Cerrar modal de cliente
        document.querySelector('[data-modal="cliente-modal"].btn-secondary').addEventListener('click', () => {
            cerrarModal('cliente-modal');
        });
        
        document.querySelector('[data-modal="cliente-modal"].close-modal').addEventListener('click', () => {
            cerrarModal('cliente-modal');
        });

        // Botones de edición
        btnEditCliente.addEventListener('click', () => editClienteSeleccionado());
        btnEditItem.addEventListener('click', () => editItemSeleccionado());
        
        // Cambios en el select de cliente para habilitar/deshabilitar edición
        clienteSelect.addEventListener('change', () => {
            btnEditCliente.disabled = !clienteSelect.value;
        });
        
        // Cambios en el select de items para habilitar/deshabilitar edición
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-select')) {
                const hayItemSeleccionado = Array.from(document.querySelectorAll('.item-select'))
                    .some(select => select.value);
                btnEditItem.disabled = !hayItemSeleccionado;
            }
        });
    }

    // Función para editar cliente seleccionado
    async function editClienteSeleccionado() {
        const clienteId = clienteSelect.value;
        if (!clienteId) return;
        
        try {
            const response = await fetch(`${API_URL}/clientes/${clienteId}`);
            if (!response.ok) throw new Error('Error al cargar el cliente');
            
            const cliente = await response.json();
            openClienteModal(cliente);
        } catch (error) {
            showError('Error al cargar el cliente: ' + error.message);
        }
    }

    // Función para editar item seleccionado
    async function editItemSeleccionado() {
        // Encontrar el primer item seleccionado
        const itemSelects = document.querySelectorAll('.item-select');
        let itemId = null;
        
        for (const select of itemSelects) {
            if (select.value) {
                itemId = select.value;
                break;
            }
        }
        
        if (!itemId) return;
        
        try {
            const response = await fetch(`${API_URL}/items/${itemId}`);
            if (!response.ok) throw new Error('Error al cargar el item');
            
            const item = await response.json();
            openItemModal(item);
        } catch (error) {
            showError('Error al cargar el item: ' + error.message);
        }
    }

    // Función para abrir el modal de cliente
    function openClienteModal() {
        if (cliente) {
            // Modo edición
            clienteModalTitle.textContent = 'Editar Cliente';
            clienteIdInput.value = cliente.id;
            clienteNombreInput.value = cliente.nombre;
        } else {
            // Modo creación
            clienteModalTitle.textContent = 'Crear Nuevo Cliente';
            clienteForm.reset();
            clienteIdInput.value = '';
        }
        clienteModal.style.display = 'flex';
        clienteNombreInput.focus();
    }
    
    function switchTab(tabId) {
        // Actualizar botones de tab
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        // Actualizar contenido de tab
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
        
        // Si es el tab de historial, actualizar la lista
        if (tabId === 'historial') {
            fetchCotizaciones();
            renderCotizacionesList();
        }
    }
    
    async function fetchClientes() {
        try {
            const response = await fetch(`${API_URL}/clientes`);
            if (!response.ok) throw new Error('Error al obtener clientes');
            clientes = await response.json();
            console.log("Clientes cargados:", clientes);
        } catch (error) {
            showError('No se pudieron cargar los clientes');
            console.error(error);
        }
    }
    
    async function fetchItems() {
        try {
            const response = await fetch(`${API_URL}/items`);
            if (!response.ok) throw new Error('Error al obtener items');
            items = await response.json();
            console.log("Items cargados:", items);
        } catch (error) {
            showError('No se pudieron cargar los items');
            console.error(error);
        }
    }
    
    async function fetchCotizaciones() {
        try {
            const response = await fetch(`${API_URL}/cotizaciones`);
            if (!response.ok) throw new Error('Error al obtener cotizaciones');
            const cotizacionesPag = await response.json();
            console.log("Cotizaciones paginadas:", cotizacionesPag);
            cotizaciones = cotizacionesPag.cotizaciones;
            console.log("Cotizaciones cargadas:", cotizaciones);
        } catch (error) {
            showError('No se pudieron cargar las cotizaciones');
            console.error(error);
        }
    }

    // Nueva función para obtener tipos de items
    async function fetchItemTypes() {
        try {
            const response = await fetch(`${API_URL}/items/tipos`);
            if (!response.ok) throw new Error('Error al obtener tipos de items');
            itemTypes = await response.json();
        } catch (error) {
            showError('No se pudieron cargar los tipos de items');
            console.error(error);
        }
    }

    // Función para renderizar tipos de items en el select
    function renderItemTypesSelect() {
        itemTypeSelect.innerHTML = '<option value="">Seleccione un tipo</option>';
        itemTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            itemTypeSelect.appendChild(option);
        });
    }
    
    function renderClientesSelect() {
       const currentValue = clienteSelect.value;
        
        // Mostrar estado de loading si no hay clientes
        if (clientes.length === 0) {
            clienteSelect.innerHTML = '<option value="">Cargando clientes...</option>';
            clienteSelect.disabled = true;
            return;
        }
        
        clienteSelect.disabled = false;
        clienteSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            clienteSelect.appendChild(option);
        });
        
        // Restaurar valor seleccionado si existe
        if (currentValue && clientes.some(cliente => cliente.id == currentValue)) {
            clienteSelect.value = currentValue;
        }
    }
    
    function renderItemsSelect() {
        const itemSelects = document.querySelectorAll('.item-select');
        itemSelects.forEach(select => {
            // Guardar el valor seleccionado actual
            const currentValue = select.value;
            
            // Reconstruir las opciones
            select.innerHTML = '<option value="">Seleccione un item</option>';
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                option.dataset.price = item.price;
                select.appendChild(option);
            });
            
            // Restaurar el valor seleccionado si existe
            if (currentValue && items.some(item => item.id == currentValue)) {
                select.value = currentValue;
                updateItemPrice(select);
            }
        });
    }

    // Función para abrir el modal de item
    function openItemModal(item = null) {
        if (item) {
            // Modo edición
            itemModalTitle.textContent = 'Editar Item';
            itemIdInput.value = item.id;
            itemNameInput.value = item.name;
            itemDescriptionInput.value = item.description || '';
            itemPriceInput.value = item.price;
            itemTypeSelect.value = item.type_id;
        } else {
            // Modo creación
            itemModalTitle.textContent = 'Crear Nuevo Item';
            itemForm.reset();
            itemIdInput.value = '';
        }
        itemModal.style.display = 'flex';
    }

    // Función para cerrar modales
    function cerrarModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Manejar envío del formulario de item
    async function handleItemSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: itemNameInput.value.trim(),
            description: itemDescriptionInput.value.trim(),
            price: parseFloat(itemPriceInput.value),
            type_id: parseInt(itemTypeSelect.value)
        };
        
        // Validaciones
        if (!formData.name) {
            showError('El nombre del item es requerido');
            return;
        }
        
        if (!formData.price || formData.price <= 0) {
            showError('El precio debe ser mayor a 0');
            return;
        }
        
        if (!formData.type_id) {
            showError('Seleccione un tipo de item');
            return;
        }
        
        const url = `${API_URL}/items`;
        const method = 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el item');
            }
            
            const result = await response.json();
            
            showSuccess('Item creado exitosamente');
            
            // Cerrar modal y actualizar datos
            cerrarModal('item-modal');
            await fetchItems();
            renderItemsSelect();
            
            // Si estamos en la pestaña de crear cotización, actualizar
            if (document.getElementById('crear').classList.contains('active')) {
                updateSummary();
            }
            
        } catch (error) {
            showError(error.message);
            console.error('Error:', error);
        }
    }
    
    function addItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <select class="item-select" required>
                <option value="">Seleccione un item</option>
            </select>
            <input type="number" class="item-quantity" min="1" value="1" required>
            <span class="item-price">$0.00</span>
            <button type="button" class="btn-remove-item"><i class="fas fa-trash"></i></button>
        `;
        
        itemsContainer.appendChild(itemRow);
        renderItemsSelect();
        
        // Event listeners para la nueva fila
        const select = itemRow.querySelector('.item-select');
        const quantityInput = itemRow.querySelector('.item-quantity');
        const removeBtn = itemRow.querySelector('.btn-remove-item');
        
        select.addEventListener('change', () => updateItemPrice(select));
        quantityInput.addEventListener('input', updateSummary);
        removeBtn.addEventListener('click', () => {
            itemRow.remove();
            updateSummary();
        });
    }
    
    function updateItemPrice(select) {
        const row = select.closest('.item-row');
        const priceElement = row.querySelector('.item-price');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price);
            priceElement.textContent = `$${price.toFixed(2)}`;
        } else {
            priceElement.textContent = '$0.00';
        }
        
        updateSummary();
    }
    
    function updateSummary() {
        const itemRows = document.querySelectorAll('.item-row');
        let total = 0;
        
        summaryItems.innerHTML = '';
        
        itemRows.forEach(row => {
            const select = row.querySelector('.item-select');
            const quantityInput = row.querySelector('.item-quantity');
            
            if (select.value && quantityInput.value) {
                const selectedOption = select.options[select.selectedIndex];
                const price = parseFloat(selectedOption.dataset.price);
                const quantity = parseInt(quantityInput.value);
                const itemTotal = price * quantity;
                
                total += itemTotal;
                
                const summaryItem = document.createElement('div');
                summaryItem.className = 'summary-item';
                summaryItem.innerHTML = `
                    <span>${selectedOption.textContent} x ${quantity}</span>
                    <span>$${itemTotal.toFixed(2)}</span>
                `;
                summaryItems.appendChild(summaryItem);
            }
        });
        
        totalAmount.textContent = `$${total.toFixed(2)}`;
    }
    
    async function handleSubmitCotizacion(e) {
        e.preventDefault();
        
        // Validar cliente seleccionado
        if (!clienteSelect.value) {
            showError('Seleccione un cliente');
            return;
        }
        
        // Validar items
        const itemRows = document.querySelectorAll('.item-row');
        const cotizacionItems = [];
        
        for (const row of itemRows) {
            const select = row.querySelector('.item-select');
            const quantityInput = row.querySelector('.item-quantity');
            
            if (!select.value || !quantityInput.value || parseInt(quantityInput.value) < 1) {
                showError('Todos los items deben estar completos y con cantidad válida');
                return;
            }
            
            cotizacionItems.push({
                id: select.value,
                quantity: parseInt(quantityInput.value)
            });
        }
        
        if (cotizacionItems.length === 0) {
            showError('Agregue al menos un item');
            return;
        }
        
        // Enviar datos al servidor
        try {
            const response = await fetch(`${API_URL}/cotizaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clienteId: clienteSelect.value,
                    items: cotizacionItems
                })
            });
            
            if (!response.ok) throw new Error('respuesta error al crear cotización');
            
            const data = await response.json();
            
            // Mostrar éxito y resetear formulario
            showSuccess('Cotización creada exitosamente');
            
            resetForm();
            
            // Mostrar la cotización creada
            console.log("Cotización creada:", data);
            currentCotizacionId = data.cotizacion.id;
            showCotizacionModal(currentCotizacionId);
            
            // Actualizar lista de cotizaciones
            await fetchCotizaciones();
            renderCotizacionesList();
            
        } catch (error) {
            showError('Error al crear la cotización');
            console.error(error);
        }
    }
    
    function resetForm() {
        cotizacionForm.reset();
        itemsContainer.innerHTML = '';
        summaryItems.innerHTML = '';
        totalAmount.textContent = '$0.00';
        addItemRow();
    }
    
    function renderCotizacionesList() {
        cotizacionesList.innerHTML = '';
        
        if (cotizaciones.length === 0) {
            cotizacionesList.innerHTML = '<p class="no-results">No hay cotizaciones registradas</p>';
            return;
        }
        
        cotizaciones.forEach(cotizacion => {
            const card = document.createElement('div');
            card.className = 'cotizacion-card';
            card.innerHTML = `
                <h3>Cotización #${cotizacion.id}</h3>
                <p class="cliente">${cotizacion.cliente_nombre}</p>
                <p class="fecha">${new Date(cotizacion.fecha).toLocaleDateString()}</p>
                <p class="total">Total: $${cotizacion.total}</p>
            `;
            
            card.addEventListener('click', () => {
                currentCotizacionId = cotizacion.id;
                showCotizacionModal(currentCotizacionId);
            });
            
            cotizacionesList.appendChild(card);
        });
    }
    
    function searchCotizaciones() {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderCotizacionesList();
            return;
        }
        
        const filtered = cotizaciones.filter(cot => 
            cot.id.toLowerCase().includes(searchTerm) ||
            cot.cliente_nombre.toLowerCase().includes(searchTerm) ||
            cot.fecha.includes(searchTerm) ||
            cot.total.toString().includes(searchTerm)
        );
        
        if (filtered.length === 0) {
            cotizacionesList.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
            return;
        }
        
        cotizacionesList.innerHTML = '';
        filtered.forEach(cotizacion => {
            const card = document.createElement('div');
            card.className = 'cotizacion-card';
            card.innerHTML = `
                <h3>Cotización #${cotizacion.id}</h3>
                <p class="cliente">${cotizacion.cliente_nombre}</p>
                <p class="fecha">${new Date(cotizacion.fecha).toLocaleDateString()}</p>
                <p class="total">Total: $${parseFloat(cotizacion.total).toFixed(2)}</p>
            `;
            
            card.addEventListener('click', () => {
                currentCotizacionId = cotizacion.id;
                showCotizacionModal(currentCotizacionId);
            });
            
            cotizacionesList.appendChild(card);
        });
    }
    
    async function showCotizacionModal(cotizacionId) {
        try {
            console.log("Obteniendo cotización ID:", cotizacionId);
            
            // Mostrar loader mientras carga
            modalBody.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando cotización...</p>
                </div>
            `;
            modal.style.display = 'flex';

            //Hacer llamada al endpoint
            const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}`);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

            const cotizacionData = await response.json();
            console.log("Cotización obtenida:", cotizacionData);

            // Verificar que la cotización tenga los datos necesarios
            if (!cotizacionData || !cotizacionData.items) {
                throw new Error('Datos de cotización incompletos');
            }

            modalTitle.textContent = `Cotización #${cotizacionData.id}`;

            modalBody.innerHTML = `
                <div class="modal-info">
                    <p><strong>Cliente:</strong> ${cotizacionData.cliente_nombre}</p>
                    <p><strong>Fecha:</strong> ${new Date(cotizacionData.fecha).toLocaleDateString()}</p>
                </div>
                
                <div class="modal-items">
                    <h4>Items</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Precio Unitario</th>
                                <th>Cantidad</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cotizacionData.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-total">
                    <p><strong>Total:</strong> $${parseFloat(cotizacionData.total).toFixed(2)}</p>
                </div>
            `;

        } catch (error) {
            console.error('Error al cargar la cotización:', error);
            modalBody.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error al cargar la cotización</h4>
                    <p>${error.message}</p>
                    <button onclick="showCotizacionModal('${cotizacionId}')" class="btn-secondary">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }

    }
    
    async function downloadPDF() {
        if (!currentCotizacionId) return;
        
        try {
            const response = await fetch(`${API_URL}/cotizaciones/${currentCotizacionId}/pdf`);
            if (!response.ok) throw new Error('Error al generar PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cotizacion_${currentCotizacionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            showError('Error al descargar el PDF');
            console.error(error);
        }
    }

    // Manejar envío del formulario de cliente
    async function handleClienteSubmit(e) {
        e.preventDefault();
        
        const nombre = clienteNombreInput.value.trim();
        
        // Validaciones
        if (!nombre) {
            showError('El nombre del cliente es requerido');
            return;
        }
        
        if (nombre.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            return;
        }
        
        // Mostrar loading en el botón
        const submitBtn = clienteForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear el cliente');
            }
            
            const result = await response.json();
            
            showSuccess('Cliente creado exitosamente');
            
            // Cerrar modal
            cerrarModal('cliente-modal');
            
            // Actualizar lista de clientes y select
            await fetchClientes();
            renderClientesSelect();
            
            // Seleccionar automáticamente el nuevo cliente
            clienteSelect.value = result.cliente.id;
            
        } catch (error) {
            showError(error.message);
            console.error('Error:', error);
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Reemplaza tus funciones showError/showSuccess con estas versiones mejoradas
    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
});