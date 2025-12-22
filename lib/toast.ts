type ToastType = "success" | "error" | "info" | "loading"

interface ToastOptions {
  id?: string
}

// Track loading toasts by ID
const activeToasts = new Map<string, HTMLElement>()

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    if (options?.id && activeToasts.has(options.id)) {
      updateToast(options.id, message, "success")
    } else {
      showToast(message, "success", options?.id)
    }
  },
  error: (message: string, options?: ToastOptions) => {
    if (options?.id && activeToasts.has(options.id)) {
      updateToast(options.id, message, "error")
    } else {
      showToast(message, "error", options?.id)
    }
  },
  info: (message: string, options?: ToastOptions) => {
    if (options?.id && activeToasts.has(options.id)) {
      updateToast(options.id, message, "info")
    } else {
      showToast(message, "info", options?.id)
    }
  },
  loading: (message: string, options?: ToastOptions) => {
    if (options?.id && activeToasts.has(options.id)) {
      updateToast(options.id, message, "loading")
    } else {
      showToast(message, "loading", options?.id)
    }
  },
  dismiss: (id: string) => {
    removeToast(id)
  },
}

function updateToast(id: string, message: string, type: ToastType) {
  const existingToast = activeToasts.get(id)
  if (existingToast) {
    existingToast.textContent = message
    existingToast.className = getToastClassName(type)

    if (type !== "loading") {
      setTimeout(() => {
        removeToast(id)
      }, 3000)
    }
  }
}

function getToastClassName(type: ToastType): string {
  const baseClass =
    "fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all animate-in slide-in-from-bottom-5"

  switch (type) {
    case "success":
      return `${baseClass} bg-green-600 text-white`
    case "error":
      return `${baseClass} bg-red-600 text-white`
    case "loading":
      return `${baseClass} bg-blue-600 text-white`
    default:
      return `${baseClass} bg-blue-600 text-white`
  }
}

function showToast(message: string, type: ToastType, id?: string) {
  const toastEl = document.createElement("div")
  toastEl.className = getToastClassName(type)
  toastEl.textContent = message

  document.body.appendChild(toastEl)

  if (id) {
    activeToasts.set(id, toastEl)
  }

  if (type !== "loading") {
    setTimeout(() => {
      toastEl.classList.add("animate-out", "fade-out", "slide-out-to-bottom-5")
      setTimeout(() => {
        if (id) {
          removeToast(id)
        } else {
          document.body.removeChild(toastEl)
        }
      }, 300)
    }, 3000)
  }
}

function removeToast(id: string) {
  const toastEl = activeToasts.get(id)
  if (toastEl && document.body.contains(toastEl)) {
    toastEl.classList.add("animate-out", "fade-out", "slide-out-to-bottom-5")
    setTimeout(() => {
      if (document.body.contains(toastEl)) {
        document.body.removeChild(toastEl)
      }
      activeToasts.delete(id)
    }, 300)
  }
}
