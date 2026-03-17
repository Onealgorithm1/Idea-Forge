const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Auto-inject tenant context from auth state or TenantProvider
function getTenantHeaders(): Record<string, string> {
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) return { 'X-Tenant-ID': tenantId };
  
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.tenantId) return { 'X-Tenant-ID': user.tenantId };
  } catch { /* ignore */ }
  return {};
}

export const api = {
  async get(endpoint: string, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getTenantHeaders(),
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
      ...getTenantHeaders(),
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

  async patch(endpoint: string, data: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...getTenantHeaders(),
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
      ...getTenantHeaders(),
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
};
