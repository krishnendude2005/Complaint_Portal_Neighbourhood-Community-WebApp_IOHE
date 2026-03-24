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

export function getDefaultPriority(category, subcategory) {
  const critical = ['No Water Supply', 'Power Outage', 'Stuck', 'Gas leakage', 'Fire alarm'];
  const high = ['Leakage', 'Suspicious Activity', 'Not Working'];
  if (critical.some(s => (subcategory || '').toLowerCase().includes(s.toLowerCase()))) return 'critical';
  if (high.some(s => (subcategory || '').toLowerCase().includes(s.toLowerCase()))) return 'high';
  if (category === 'other') return 'medium';
  return 'medium';
}
