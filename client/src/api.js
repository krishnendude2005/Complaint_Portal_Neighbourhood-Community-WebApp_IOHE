const API = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const auth = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const complaints = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/complaints${q ? '?' + q : ''}`);
  },
  get: (id) => request(`/complaints/${id}`),
  create: (data) => request('/complaints', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  assign: (id, assignedTo, internalNote) => request(`/complaints/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo, internalNote })
  }),
  updateStatus: (id, status, comment, photos) => request(`/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment, photos })
  }),
  resolve: (id, resolutionNote, completionPhotos) => request(`/complaints/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ resolutionNote, completionPhotos })
  }),
  rate: (id, rating, feedback) => request(`/complaints/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, feedback })
  }),
  changePriority: (id, priority) => request(`/complaints/${id}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority })
  }),
  addComment: (id, comment, visibility) => request(`/complaints/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment, visibility })
  }),
  delete: (id) => request(`/complaints/${id}`, { method: 'DELETE' })
};

export const users = {
  getStaff: () => request('/users/staff')
};

export const societies = {
  register: (data) => request('/societies/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createInvitation: (societyId, data) => request(`/societies/${societyId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const invitations = {
  accept: (token) => request(`/societies/invitations/accept/${token}`),
  acceptRegister: (token, data) => request(`/societies/invitations/accept/${token}/register`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const CATEGORIES = {
  plumbing: { subcategories: ['Leakage', 'Blocked Drain', 'No Water Supply', 'Low Pressure'] },
  electrical: { subcategories: ['Power Outage', 'Switch/Socket Issue', 'Light Failure', 'Meter Problem'] },
  elevator: { subcategories: ['Not Working', 'Stuck', 'Strange Noise', 'Door Issue'] },
  common_areas: { subcategories: ['Garden', 'Gym', 'Pool', 'Parking', 'Clubhouse'] },
  security: { subcategories: ['Gate Issue', 'CCTV Not Working', 'Suspicious Activity', 'Lost Item'] },
  cleanliness: { subcategories: ['Garbage Collection', 'Pest Control', 'Housekeeping'] },
  structural: { subcategories: ['Wall Crack', 'Paint Peeling', 'Seepage', 'Ceiling Damage'] },
  noise: { subcategories: ['Construction', 'Music/Party', 'Vehicle', 'Other'] },
  parking: { subcategories: ['Wrong Parking', 'Visitor Slot Occupied', 'Damaged Vehicle'] },
  other: { subcategories: [] }
};

export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export const STATUSES = ['open', 'assigned', 'in_progress', 'waiting_for_parts', 'waiting_for_approval', 'resolved', 'closed', 'reopened'];
