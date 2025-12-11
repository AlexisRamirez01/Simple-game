export const createHttpService = (customBaseUrl) => {
  const baseUrl = customBaseUrl || import.meta.env.VITE_SERVER_URI || "http://localhost:8000";

  const request = async (url, options = {}) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  return {
    get: (endpoint, params) => {
      const query = params ? "?" + new URLSearchParams(params) : "";
      return request(`${baseUrl}${endpoint}${query}`);
    },
    post: (endpoint, body, params) => {
      const query = params ? "?" + new URLSearchParams(params) : "";
      return request(`${baseUrl}${endpoint}${query}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    put: (endpoint, body, params) => {
      const query = params ? "?" + new URLSearchParams(params) : "";
      return request(`${baseUrl}${endpoint}${query}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    patch: (endpoint, body, params) => {
    const query = params ? "?" + new URLSearchParams(params) : "";
    return request(`${baseUrl}${endpoint}${query}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    },
    delete: (endpoint, params) => {
      const query = params ? "?" + new URLSearchParams(params) : "";
      return request(`${baseUrl}${endpoint}${query}`, { method: "DELETE" });
    },
  };
};
