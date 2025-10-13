import axios from 'axios';

const VIOLATION_KEY = 'retry_violation_queue';
const SNAPSHOT_KEY = 'retry_snapshot_queue';
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function readQueue(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function writeQueue(key, q) { localStorage.setItem(key, JSON.stringify(q || [])); }

export async function flushViolationQueue(toastAdd) {
  const q = readQueue(VIOLATION_KEY);
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      await axios.post(`${API_BASE}/api/exam/violation`, item);
      toastAdd?.(`Synced violation: ${item.message}`);
    } catch (e) {
      remaining.push(item);
    }
  }
  writeQueue(VIOLATION_KEY, remaining);
}

export async function enqueueViolation(item) {
  const q = readQueue(VIOLATION_KEY);
  q.push(item);
  writeQueue(VIOLATION_KEY, q);
  // try immediate send if online
  if (navigator.onLine) {
    try {
      await axios.post(`${API_BASE}/api/exam/violation`, item);
      // on success remove last queued
      const re = readQueue(VIOLATION_KEY);
      re.shift();
      writeQueue(VIOLATION_KEY, re);
    } catch (e) {
      // leave in queue
    }
  }
}

export async function enqueueSnapshot(formDataObj) {
  // formDataObj: { base64, filename, meta: {sessionId, violations,...} }
  const q = readQueue(SNAPSHOT_KEY);
  q.push(formDataObj);
  writeQueue(SNAPSHOT_KEY, q);
  if (navigator.onLine) await flushSnapshotQueue();
}

export async function flushSnapshotQueue(toastAdd) {
  const q = readQueue(SNAPSHOT_KEY);
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      // reconstruct FormData
      const blob = base64ToBlob(item.base64, 'image/jpeg');
      const fd = new FormData();
      fd.append('image', blob, item.filename || 'snapshot.jpg');
      fd.append('sessionId', item.meta?.sessionId || '');
      fd.append('violations', JSON.stringify(item.meta?.violations || []));
      await axios.post(`${API_BASE}/api/exam/snapshot`, fd);
      toastAdd?.('Synced snapshot');
    } catch (e) {
      remaining.push(item);
    }
  }
  writeQueue(SNAPSHOT_KEY, remaining);
}

// utilities
export function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]); // return base64 string (no prefix)
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}
export function base64ToBlob(base64, type = 'image/jpeg') {
  const binary = atob(base64);
  let len = binary.length;
  const bytes = new Uint8Array(len);
  while (len--) bytes[len] = binary.charCodeAt(len);
  return new Blob([bytes], { type });
}

// auto flush when online
window.addEventListener('online', () => {
  // dynamic import to avoid circular imports
  import('./retryQueue').then(mod => {
    const { flushViolationQueue, flushSnapshotQueue } = mod;
    // optionally pass a toast function, but toast not available here; flush will run silently
    flushViolationQueue();
    flushSnapshotQueue();
  });
});
