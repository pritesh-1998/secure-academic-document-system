// Helper to mask sensitive strings like emails and phone numbers
// e.g. "alice@university.edu" → "a****@university.edu"
export function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  return user[0] + '****@' + domain;
}

// e.g. "514-555-1234" → "***-***-1234"
export function maskPhone(phone) {
  if (!phone) return '';
  return '***-***-' + phone.slice(-4);
}

// Format date string to readable format
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Calculate days remaining until deadline
export function daysUntil(deadlineStr) {
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return diff;
}

// Get urgency level based on days remaining
export function getUrgency(daysLeft) {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= 2) return 'danger';
  if (daysLeft <= 5) return 'warning';
  return 'safe';
}

// Format file size for display
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get initials from name for avatars
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
