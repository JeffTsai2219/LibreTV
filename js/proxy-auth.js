/**
 * 代理请求鉴权模块
 * 个人站点版本默认开放，不再校验密码
 */

// 兼容原有接口，返回空哈希
let cachedPasswordHash = null;

async function getPasswordHash() {
    cachedPasswordHash = null;
    return null;
}

async function addAuthToProxyUrl(url) {
    return url;
}

function validateProxyAuth() {
    return true;
}

function clearAuthCache() {
    cachedPasswordHash = null;
    localStorage.removeItem('proxyAuthHash');
}

window.addEventListener('storage', (e) => {
    if (e.key === 'userPassword' || (window.PASSWORD_CONFIG && e.key === window.PASSWORD_CONFIG.localStorageKey)) {
        clearAuthCache();
    }
});

window.ProxyAuth = {
    addAuthToProxyUrl,
    validateProxyAuth,
    clearAuthCache,
    getPasswordHash
};
