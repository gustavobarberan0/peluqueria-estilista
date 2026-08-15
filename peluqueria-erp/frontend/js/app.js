// Aplicación principal
class App {
  constructor() {
    this.currentRoute = 'dashboard';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateDate();
    this.loadRoute('dashboard');
  }

  setupEventListeners() {
    // Menú de navegación
    document.querySelectorAll('.menu li').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        this.loadRoute(route);
        
        // Actualizar clase active
        document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Botón de backup
    document.getElementById('btn-backup')?.addEventListener('click', async () => {
      await this.createBackup();
    });

    // Botón de logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.confirmExit();
    });

    // Cerrar modal
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.querySelector('.modal-overlay')?.addEventListener('click', () => {
      this.closeModal();
    });
  }

  updateDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      dateElement.textContent = now.toLocaleDateString('es-ES', options);
    }
  }

  async loadRoute(route) {
    this.currentRoute = route;
    const contentArea = document.getElementById('page-content');
    const pageTitle = document.getElementById('page-title');

    const titles = {
      dashboard: 'Dashboard',
      appointments: 'Gestión de Citas',
      clients: 'Clientes',
      stylists: 'Estilistas',
      inventory: 'Inventario',
      reports: 'Reportes'
    };

    pageTitle.textContent = titles[route] || 'Peluquería ERP';

    try {
      switch (route) {
        case 'dashboard':
          await this.loadDashboard(contentArea);
          break;
        case 'appointments':
          await this.loadAppointments(contentArea);
          break;
        case 'clients':
          await this.loadClients(contentArea);
          break;
        case 'stylists':
          await this.loadStylists(contentArea);
          break;
        case 'inventory':
          await this.loadInventory(contentArea);
          break;
        case 'reports':
          await this.loadReports(contentArea);
          break;
        default:
          contentArea.innerHTML = '<p>Vista no disponible</p>';
      }
    } catch (error) {
      console.error(`Error cargando ${route}:`, error);
      contentArea.innerHTML = `
        <div class="card">
          <h3>Error al cargar la vista</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  async loadDashboard(container) {
    const template = document.getElementById('template-dashboard');
    if (template) {
      container.innerHTML = template.innerHTML;
    } else {
      container.innerHTML = `
        <div class="dashboard">
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon blue"><i class="fas fa-calendar-check"></i></div>
              <div class="kpi-info">
                <h3 id="kpi-appointments">-</h3>
                <p>Citas Hoy</p>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green"><i class="fas fa-dollar-sign"></i></div>
              <div class="kpi-info">
                <h3 id="kpi-revenue">-</h3>
                <p>Ingresos Hoy</p>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon purple"><i class="fas fa-user-plus"></i></div>
              <div class="kpi-info">
                <h3 id="kpi-new-clients">-</h3>
                <p>Clientes Nuevos</p>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon orange"><i class="fas fa-percentage"></i></div>
              <div class="kpi-info">
                <h3 id="kpi-occupancy">-</h3>
                <p>Ocupación</p>
              </div>
            </div>
          </div>
          <div class="card">
            <h3><i class="fas fa-chart-line"></i> Tendencia de Ventas</h3>
            <canvas id="salesChart" height="100"></canvas>
          </div>
        </div>
      `;
    }

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      // Cargar KPIs
      const kpis = await apiService.getKPIs();
      
      document.getElementById('kpi-appointments').textContent = kpis.appointmentsToday || 0;
      document.getElementById('kpi-revenue').textContent = `€${(kpis.revenueToday || 0).toFixed(2)}`;
      document.getElementById('kpi-new-clients').textContent = kpis.newClientsThisMonth || 0;
      document.getElementById('kpi-occupancy').textContent = `${kpis.occupancyRate || 0}%`;

      // Cargar alertas de stock
      const lowStock = await apiService.getLowStock();
      const alertsContainer = document.getElementById('low-stock-alerts');
      if (alertsContainer && lowStock.length > 0) {
        alertsContainer.innerHTML = lowStock.map(p => `
          <div class="alert-item">
            <strong>${p.name}</strong> - Stock: ${p.stock} (Mín: ${p.minStock})
          </div>
        `).join('');
      } else if (alertsContainer) {
        alertsContainer.innerHTML = '<p style="padding: 12px; color: var(--success-color);">✓ No hay alertas de stock</p>';
      }

      // Cargar próximas citas
      const upcoming = await apiService.getUpcomingAppointments();
      const upcomingContainer = document.getElementById('upcoming-appointments');
      if (upcomingContainer) {
        if (upcoming.length > 0) {
          upcomingContainer.innerHTML = upcoming.slice(0, 5).map(app => `
            <div class="appointment-item">
              <div class="appointment-info">
                <h4>${app.client.name}</h4>
                <p>${app.time} - ${app.stylist.name}</p>
              </div>
              <span class="status-badge status-${app.status}">${this.translateStatus(app.status)}</span>
            </div>
          `).join('');
        } else {
          upcomingContainer.innerHTML = '<p style="padding: 15px; color: var(--text-light);">No hay citas próximas</p>';
        }
      }

      // Cargar gráfico de ventas
      await this.loadSalesChart();

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  }

  async loadSalesChart() {
    try {
      const chartsData = await apiService.getCharts();
      const ctx = document.getElementById('salesChart');
      
      if (ctx && window.Chart) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartsData.salesTrend.labels,
            datasets: [{
              label: 'Ventas (€)',
              data: chartsData.salesTrend.data,
              borderColor: '#9b59b6',
              backgroundColor: 'rgba(155, 89, 182, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error cargando gráfico:', error);
    }
  }

  async loadAppointments(container) {
    const template = document.getElementById('template-appointments');
    if (template) {
      container.innerHTML = template.innerHTML;
    } else {
      container.innerHTML = `
        <div class="appointments-view">
          <div class="view-header">
            <div class="view-filters">
              <input type="date" id="filter-date" class="form-control">
              <select id="filter-stylist" class="form-control">
                <option value="">Todos los estilistas</option>
              </select>
            </div>
            <button id="btn-new-appointment" class="btn btn-primary">
              <i class="fas fa-plus"></i> Nueva Cita
            </button>
          </div>
          <div id="appointments-list" class="appointments-list-view"></div>
        </div>
      `;
    }

    await this.loadAppointmentsList();
    
    // Event listeners para filtros
    document.getElementById('filter-date')?.addEventListener('change', () => {
      this.loadAppointmentsList();
    });
    
    document.getElementById('btn-new-appointment')?.addEventListener('click', () => {
      this.showNewAppointmentModal();
    });
  }

  async loadAppointmentsList() {
    try {
      const filters = {};
      const dateFilter = document.getElementById('filter-date')?.value;
      if (dateFilter) filters.date = dateFilter;

      const appointments = await apiService.getAppointments(filters);
      const container = document.getElementById('appointments-list');
      
      if (container) {
        if (appointments.length > 0) {
          container.innerHTML = `
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Estilista</th>
                    <th>Servicios</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointments.map(app => `
                    <tr>
                      <td>${new Date(app.date).toLocaleDateString('es-ES')}</td>
                      <td>${app.time}</td>
                      <td>${app.client.name}</td>
                      <td>${app.stylist.name}</td>
                      <td>${app.services.map(s => s.name).join(', ')}</td>
                      <td>€${(app.total || 0).toFixed(2)}</td>
                      <td><span class="status-badge status-${app.status}">${this.translateStatus(app.status)}</span></td>
                      <td>
                        <button class="btn-icon" onclick="app.editAppointment('${app.id}')">
                          <i class="fas fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        } else {
          container.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-light);">No hay citas para mostrar</p>';
        }
      }

      // Cargar estilistas en el filtro
      const stylists = await apiService.getStylists();
      const stylistFilter = document.getElementById('filter-stylist');
      if (stylistFilter) {
        stylistFilter.innerHTML = '<option value="">Todos los estilistas</option>' +
          stylists.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  }

  async loadClients(container) {
    container.innerHTML = `
      <div class="clients-view">
        <div class="view-header">
          <div class="search-box">
            <input type="text" id="client-search" class="form-control" placeholder="Buscar por nombre o teléfono...">
          </div>
          <button id="btn-new-client" class="btn btn-primary">
            <i class="fas fa-user-plus"></i> Nuevo Cliente
          </button>
        </div>
        <div id="clients-table" class="data-table"></div>
      </div>
    `;

    await this.loadClientsTable();

    document.getElementById('client-search')?.addEventListener('input', (e) => {
      this.loadClientsTable(e.target.value);
    });

    document.getElementById('btn-new-client')?.addEventListener('click', () => {
      this.showNewClientModal();
    });
  }

  async loadClientsTable(search = '') {
    try {
      const result = await apiService.getClients(1, search);
      const container = document.getElementById('clients-table');
      
      if (container) {
        if (result.data.length > 0) {
          container.innerHTML = `
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Puntos</th>
                  <th>Nivel</th>
                  <th>Total Gastado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${result.data.map(client => `
                  <tr>
                    <td>${client.name}</td>
                    <td>${client.phone}</td>
                    <td>${client.email || '-'}</td>
                    <td>${client.loyaltyPoints}</td>
                    <td><span class="status-badge status-${client.loyaltyTier === 'oro' ? 'completed' : client.loyaltyTier === 'plata' ? 'confirmed' : 'pending'}">${client.loyaltyTier}</span></td>
                    <td>€${parseFloat(client.totalSpent).toFixed(2)}</td>
                    <td>
                      <button class="btn-icon" onclick="app.editClient('${client.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } else {
          container.innerHTML = '<p style="padding: 20px; text-align: center;">No se encontraron clientes</p>';
        }
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }

  async loadStylists(container) {
    container.innerHTML = `
      <div class="stylists-view">
        <div class="view-header">
          <h2>Equipo de Estilistas</h2>
          <button id="btn-new-stylist" class="btn btn-primary">
            <i class="fas fa-user-plus"></i> Nuevo Estilista
          </button>
        </div>
        <div id="stylists-grid" class="stylists-grid"></div>
      </div>
    `;

    await this.loadStylistsGrid();

    document.getElementById('btn-new-stylist')?.addEventListener('click', () => {
      this.showNewStylistModal();
    });
  }

  async loadStylistsGrid() {
    try {
      const stylists = await apiService.getStylists();
      const container = document.getElementById('stylists-grid');
      
      if (container) {
        container.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            ${stylists.map(stylist => `
              <div class="card">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                  <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #9b59b6, #8e44ad); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5em;">
                    ${stylist.name.charAt(0)}
                  </div>
                  <div>
                    <h4 style="margin-bottom: 5px;">${stylist.name}</h4>
                    <span class="status-badge status-completed">★ ${stylist.rating}</span>
                  </div>
                </div>
                <p style="color: var(--text-light); margin-bottom: 10px;">
                  <i class="fas fa-cut"></i> ${stylist.specialities.join(', ')}
                </p>
                <p style="color: var(--text-light);">
                  <i class="fas fa-percentage"></i> Comisión: ${stylist.commission}%
                </p>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (error) {
      console.error('Error cargando estilistas:', error);
    }
  }

  async loadInventory(container) {
    container.innerHTML = `
      <div class="inventory-view">
        <div class="view-header">
          <div class="search-box">
            <input type="text" id="product-search" class="form-control" placeholder="Buscar producto...">
          </div>
          <button id="btn-new-product" class="btn btn-primary">
            <i class="fas fa-box"></i> Nuevo Producto
          </button>
        </div>
        <div id="products-table" class="data-table"></div>
      </div>
    `;

    await this.loadProductsTable();

    document.getElementById('product-search')?.addEventListener('input', () => {
      this.loadProductsTable();
    });

    document.getElementById('btn-new-product')?.addEventListener('click', () => {
      this.showNewProductModal();
    });
  }

  async loadProductsTable() {
    try {
      const products = await apiService.getProducts();
      const container = document.getElementById('products-table');
      
      if (container) {
        if (products.length > 0) {
          container.innerHTML = `
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Stock</th>
                  <th>Stock Mín</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(product => `
                  <tr>
                    <td>${product.sku}</td>
                    <td>${product.name}</td>
                    <td>
                      <span style="color: ${product.stock <= product.minStock ? 'var(--danger-color)' : 'var(--success-color)'}">
                        ${product.stock}
                      </span>
                    </td>
                    <td>${product.minStock}</td>
                    <td>€${parseFloat(product.costPrice).toFixed(2)}</td>
                    <td>€${parseFloat(product.sellPrice).toFixed(2)}</td>
                    <td>
                      ${product.stock <= product.minStock 
                        ? '<span class="status-badge status-cancelled">Stock Bajo</span>' 
                        : '<span class="status-badge status-completed">OK</span>'}
                    </td>
                    <td>
                      <button class="btn-icon" onclick="app.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } else {
          container.innerHTML = '<p style="padding: 20px; text-align: center;">No hay productos registrados</p>';
        }
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  async loadReports(container) {
    container.innerHTML = `
      <div class="reports-view">
        <div class="report-filters" style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 15px;"><i class="fas fa-filter"></i> Filtros</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
            <div>
              <label style="display: block; margin-bottom: 5px;">Fecha Inicio:</label>
              <input type="date" id="report-start-date" class="form-control">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px;">Fecha Fin:</label>
              <input type="date" id="report-end-date" class="form-control">
            </div>
            <button id="btn-generate-report" class="btn btn-primary">
              <i class="fas fa-file-alt"></i> Generar Reporte
            </button>
          </div>
        </div>
        <div id="report-content" class="report-content"></div>
      </div>
    `;

    document.getElementById('btn-generate-report')?.addEventListener('click', () => {
      this.generateReport();
    });
  }

  async generateReport() {
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const container = document.getElementById('report-content');

    try {
      const report = await apiService.getSalesReport({ startDate, endDate });
      
      if (container) {
        container.innerHTML = `
          <div class="card" style="margin-bottom: 20px;">
            <h3><i class="fas fa-chart-bar"></i> Resumen</h3>
            <div class="kpi-grid" style="margin-top: 20px;">
              <div class="kpi-card">
                <div class="kpi-info">
                  <h3>${report.totalAppointments}</h3>
                  <p>Citas</p>
                </div>
              </div>
              <div class="kpi-card">
                <div class="kpi-info">
                  <h3>€${report.totalRevenue.toFixed(2)}</h3>
                  <p>Ingresos Totales</p>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <h3><i class="fas fa-users"></i> Ventas por Estilista</h3>
            <div class="data-table" style="margin-top: 20px;">
              <table>
                <thead>
                  <tr>
                    <th>Estilista</th>
                    <th>Citas</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(report.salesByStylist).map(([name, data]) => `
                    <tr>
                      <td>${name}</td>
                      <td>${data.count}</td>
                      <td>€${data.revenue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      if (container) {
        container.innerHTML = '<p style="padding: 20px; color: var(--danger-color);">Error al generar el reporte</p>';
      }
    }
  }

  // Utilidades
  translateStatus(status) {
    const translations = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Asistió'
    };
    return translations[status] || status;
  }

  // Modales
  showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
  }

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
  }

  showNewClientModal() {
    this.showModal('Nuevo Cliente', `
      <form id="client-form">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="client-name" class="form-control" required>
        </div>
        <div class="form-group">
          <label>Teléfono *</label>
          <input type="tel" id="client-phone" class="form-control" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="client-email" class="form-control">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" onclick="app.closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
    `);

    document.getElementById('client-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiService.createClient({
          name: document.getElementById('client-name').value,
          phone: document.getElementById('client-phone').value,
          email: document.getElementById('client-email').value || null
        });
        this.closeModal();
        this.loadClients(document.getElementById('page-content'));
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }

  async createBackup() {
    if (window.electron) {
      try {
        const result = await window.electron.ipcRenderer.invoke('create-backup');
        alert(`Backup creado exitosamente: ${result.filename}`);
      } catch (error) {
        alert('Error al crear backup: ' + error.message);
      }
    } else {
      alert('Función de backup solo disponible en la aplicación de escritorio');
    }
  }

  confirmExit() {
    if (confirm('¿Está seguro de que desea salir?')) {
      if (window.electron) {
        window.electron.ipcRenderer.send('app:close');
      }
    }
  }
}

// Inicializar aplicación
const app = new App();
