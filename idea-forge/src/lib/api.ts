const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Auto-inject tenant context from auth state or TenantProvider
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  if (!tenantId) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.tenantId) headers['X-Tenant-ID'] = user.tenantId;
    } catch { /* ignore */ }
  }

  return headers;
}

export const api = {
  async get(endpoint: string, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const url = `${API_URL}${endpoint}`;
    console.log(`[API] GET ${url}`);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async post(endpoint: string, data: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async put(endpoint: string, data: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async patch(endpoint: string, data: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },

  async upload(endpoint: string, formData: FormData, token?: string) {
    const headers: any = {
      ...getAuthHeaders(),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  },
};
