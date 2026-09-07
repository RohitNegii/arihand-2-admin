import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aurum_admin_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-handle 401 Unauthorized responses (session expired / user deleted)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginEndpoint = error.config && error.config.url && error.config.url.includes("/login");
      if (!isLoginEndpoint) {
        localStorage.removeItem("aurum_admin_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getRequest = async <T = any>(url: string, config = {}): Promise<T> => {
  return (await api.get<T>(url, config)).data;
};

export const postRequest = async <T = any>(url: string, data = {}, config = {}): Promise<T> => {
  return (await api.post<T>(url, data, config)).data;
};

export const putRequest = async <T = any>(url: string, data = {}, config = {}): Promise<T> => {
  return (await api.put<T>(url, data, config)).data;
};

export const patchRequest = async <T = any>(url: string, data = {}, config = {}): Promise<T> => {
  return (await api.patch<T>(url, data, config)).data;
};

export const deleteRequest = async <T = any>(url: string, config = {}): Promise<T> => {
  return (await api.delete<T>(url, config)).data;
};

export const getImageUrl = (path: string) => {
  if (!path) return "/emerald_ring.png";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const baseUrl = API_URL.replace(/\/api$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5000";

// Homepage media may live on the backend (/uploads) or ship with the storefront (/images)
export const resolveSiteMedia = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/uploads/")) return getImageUrl(path);
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default api;
