import axios from 'axios';
import config from './config';

axios.interceptors.request.use((req) => {
    // Only attach token to your own API, not third-party calls
    if (req.url?.startsWith(config.baseApi)) {
        const token = localStorage.getItem('access_token');
        if (token) req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

axios.interceptors.response.use(
    (res) => res,
    async (err) => {
        const originalRequest = err.config;

        if (
            err.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url?.startsWith(config.baseApi) &&
            !originalRequest.url.includes('/refresh') // avoid infinite loop
        ) {
            originalRequest._retry = true;
            const refresh_token = localStorage.getItem('refresh_token');

            if (!refresh_token) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
                return Promise.reject(err);
            }

            try {
                const { data } = await axios.post(`${config.baseApi}/users/refresh`, { refresh_token });
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return axios(originalRequest); // retry original request
            } catch (refreshErr) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/auth/login';
                return Promise.reject(refreshErr);
            }
        }

        return Promise.reject(err);
    }
);