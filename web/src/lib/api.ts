import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        const res = response.data;
        // 业务错误(code !== 200)：只reject，不emit事件
        // 让错误拦截器统一处理所有错误提示
        if (res && typeof res.code === 'number' && res.code !== 200) {
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return response;
    },
    (error) => {
        // 401 未授权，跳转登录
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        } else {
            // 统一处理所有错误提示
            // 优先获取后端返回的msg，其次是message，最后是error.message
            const msg = error.response?.data?.msg
                || error.response?.data?.message
                || error.message
                || '网络错误';
            import('./events').then(({ globalEvents }) => {
                globalEvents.emit('api_error', msg);
            });
        }
        return Promise.reject(error);
    }
);

export default api;
