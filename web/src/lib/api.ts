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
        // 如果有 code 且不为 200，且 msg 存在，则提示错误
        if (res && typeof res.code === 'number' && res.code !== 200) {
            import('./events').then(({ globalEvents }) => {
                globalEvents.emit('api_error', res.msg || '请求失败');
            });
            // 可选：是否还要 reject？如果 reject，调用方 catch 会触发。
            // 用户只说"弹框提示"，没说要阻止后续逻辑。
            // 通常业务错误也需要 reject 以便组件停止 loading 状态。
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
            // 其他网络错误
            const msg = error.response?.data?.message || error.message || '网络错误';
            import('./events').then(({ globalEvents }) => {
                globalEvents.emit('api_error', msg);
            });
        }
        return Promise.reject(error);
    }
);

export default api;
