// API service for making HTTP requests to the backend

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred while fetching data');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Patient endpoints
export const patientsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/patients${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/patients/${id}`),
  create: (data) => apiRequest('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),
};

// Doctor endpoints
export const doctorsApi = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/doctors${queryString ? `?${queryString}` : ''}`);
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.getAll:', error);
      return { success: false, error: error.message };
    }
  },
  getById: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`);
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.getById:', error);
      return { success: false, error: error.message };
    }
  },
  getSpecializations: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/specializations`);
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.getSpecializations:', error);
      return { success: false, error: error.message };
    }
  },
  create: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.create:', error);
      return { success: false, error: error.message };
    }
  },
  update: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.update:', error);
      return { success: false, error: error.message };
    }
  },
  delete: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (error) {
      console.error('Error in doctorsApi.delete:', error);
      return { success: false, error: error.message };
    }
  },
};

// Appointment endpoints
export const appointmentsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/appointments${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/appointments/${id}`),
  create: (data) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancel: (id) => apiRequest(`/appointments/${id}`, { method: 'DELETE' }),
  getStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/appointments/statistics${queryString ? `?${queryString}` : ''}`);
  }
};

// Ward endpoints
export const wardsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/wards${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/wards/${id}`),
};

// Medical Records endpoints
export const medicalRecordsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/medical-records${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/medical-records/${id}`),
  create: (data) => apiRequest('/medical-records', { method: 'POST', body: JSON.stringify(data) }),
};

// Admissions endpoints
export const admissionsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admissions${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/admissions/${id}`),
  create: (data) => apiRequest('/admissions', { method: 'POST', body: JSON.stringify(data) }),
  discharge: (id, data) => apiRequest(`/admissions/${id}/discharge`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Billing endpoints
export const billingApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/billing${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/billing/${id}`),
  create: (data) => apiRequest('/billing', { method: 'POST', body: JSON.stringify(data) }),
  markAsPaid: (id) => apiRequest(`/billing/${id}/pay`, { method: 'PUT' }),
  getStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/billing/statistics${queryString ? `?${queryString}` : ''}`);
  }
};

// Hospital Dashboard/Analytics endpoints
export const analyticsApi = {
  getDashboard: async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await fetch(`${API_BASE_URL}/hospital/dashboard`);
      const data = await response.json();
      console.log('Dashboard data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch dashboard data' 
      };
    }
  },
  getAnalytics: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/hospital/analytics${queryString ? `?${queryString}` : ''}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch analytics data' 
      };
    }
  }
};

export default {
  patients: patientsApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  wards: wardsApi,
  medicalRecords: medicalRecordsApi,
  admissions: admissionsApi,
  billing: billingApi,
  analytics: analyticsApi,  // Add analytics to the default export
};
