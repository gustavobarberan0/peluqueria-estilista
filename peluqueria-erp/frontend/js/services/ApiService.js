class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = sessionStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Clientes
  getClients(page = 1, search = '') {
    return this.request(`/clients?page=${page}&search=${search}`);
  }

  createClient(data) {
    return this.request('/clients', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  updateClient(id, data) {
    return this.request(`/clients/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  }

  deleteClient(id) {
    return this.request(`/clients/${id}`, { 
      method: 'DELETE' 
    });
  }

  // Citas
  getAppointments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/appointments?${params}`);
  }

  createAppointment(data) {
    return this.request('/appointments', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  }

  changeStatus(id, status) {
    return this.request(`/appointments/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status }) 
    });
  }

  deleteAppointment(id) {
    return this.request(`/appointments/${id}`, { 
      method: 'DELETE' 
    });
  }

  // Estilistas
  getStylists() {
    return this.request('/stylists');
  }

  createStylist(data) {
    return this.request('/stylists', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  updateStylist(id, data) {
    return this.request(`/stylists/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  }

  // Productos
  getProducts() {
    return this.request('/products');
  }

  getLowStock() {
    return this.request('/products/low-stock');
  }

  createProduct(data) {
    return this.request('/products', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  updateProduct(id, data) {
    return this.request(`/products/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  }

  adjustStock(id, adjustment) {
    return this.request(`/products/${id}/stock`, { 
      method: 'PATCH', 
      body: JSON.stringify({ adjustment }) 
    });
  }

  deleteProduct(id) {
    return this.request(`/products/${id}`, { 
      method: 'DELETE' 
    });
  }

  // Reportes
  getSalesReport(filters) {
    return this.request(`/reports/sales?${new URLSearchParams(filters)}`);
  }

  getStylistPerformance(filters) {
    return this.request(`/reports/stylist-performance?${new URLSearchParams(filters)}`);
  }

  getTopClients(limit = 10) {
    return this.request(`/reports/top-clients?limit=${limit}`);
  }

  // Dashboard
  getKPIs() {
    return this.request('/dashboard/kpis');
  }

  getCharts() {
    return this.request('/dashboard/charts');
  }

  getUpcomingAppointments() {
    return this.request('/dashboard/upcoming-appointments');
  }
}

// Exportar instancia global
window.apiService = new ApiService();
