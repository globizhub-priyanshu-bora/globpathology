// Custom toast notification system
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const defaultDuration = 3000;

function createToastElement(message: string, type: ToastType) {
  const toast = document.createElement('div');
  toast.className = `fixed px-6 py-4 rounded-lg shadow-lg font-medium text-white z-50 animate-fadeIn`;
  
  // Color based on type
  const colors: Record<ToastType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };
  
  toast.className += ` ${colors[type]}`;
  toast.textContent = message;
  
  return toast;
}

function getPositionClass(position: string): string {
  const positions: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };
  return positions[position] || positions['top-right'];
}

function showToast(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
  const { duration = defaultDuration, position = 'top-right' } = options;
  
  const toastEl = createToastElement(message, type);
  toastEl.className += ` ${getPositionClass(position)}`;
  
  document.body.appendChild(toastEl);
  
  // Animate in
  setTimeout(() => {
    toastEl.style.opacity = '1';
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 0.3s ease-in-out';
    setTimeout(() => {
      document.body.removeChild(toastEl);
    }, 300);
  }, duration);
}

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => showToast(message, 'error', { duration: 4000, ...options }),
  info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
  warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
};
