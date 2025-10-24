(function () {
    // 个人站点默认开放访问，以下函数全部返回无密码状态
    const alwaysTrue = () => true;
    const alwaysFalse = () => false;
    const noop = () => {};

    window.isPasswordProtected = alwaysFalse;
    window.isPasswordRequired = alwaysFalse;
    window.isPasswordVerified = alwaysTrue;
    window.verifyPassword = async () => true;
    window.ensurePasswordProtection = alwaysTrue;
    window.showPasswordModal = noop;
    window.hidePasswordModal = noop;
    window.showPasswordError = noop;
    window.hidePasswordError = noop;

    window.handlePasswordSubmit = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        document.dispatchEvent(new CustomEvent('passwordVerified'));
        return true;
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.dispatchEvent(new CustomEvent('passwordVerified'));
    });
})();
