// 全局变量
const DEFAULT_SELECTED_APIS = Object.keys(window.API_SITES || {});
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || JSON.stringify(DEFAULT_SELECTED_APIS)); // 默认选中全部资源
if (!Array.isArray(selectedAPIs) || selectedAPIs.length === 0) {
    selectedAPIs = [...DEFAULT_SELECTED_APIS];
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
}
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;
// 搜索结果聚合缓存
let searchAggregatedResults = [];
let currentDetailSources = [];
let currentDetailSourceIndex = 0;
let currentDetailEntryTitle = '';

// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化API复选框
    initAPICheckboxes();

    // 初始化自定义API列表
    renderCustomAPIsList();

    // 初始化显示选中的API数量
    updateSelectedApiCount();

    // 渲染搜索历史
    renderSearchHistory();

    // 设置默认API选择（如果是第一次加载）
    if (!localStorage.getItem('hasInitializedDefaults')) {
        // 默认选中全部资源
        selectedAPIs = [...DEFAULT_SELECTED_APIS];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

        // 默认选中过滤开关
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

        // 默认启用豆瓣功能
        localStorage.setItem('doubanEnabled', 'true');

        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
    }

    // 设置黄色内容过滤器开关初始状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
    }

    // 设置广告过滤开关初始状态
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默认为true
    }

    // 设置事件监听器
    setupEventListeners();

    // 初始检查成人API选中状态
    setTimeout(checkAdultAPIsSelected, 100);
});

// 初始化API复选框
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

    // 添加普通API组标题
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2';
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    normaldiv.appendChild(normalTitle);

    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        if (api.adult) return; // 跳过成人内容API，稍后添加

        const checked = selectedAPIs.includes(apiKey);

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                   class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333]" 
                   ${checked ? 'checked' : ''} 
                   data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        normaldiv.appendChild(checkbox);

        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
    container.appendChild(normaldiv);

    // 添加成人API列表
    addAdultAPI();

    // 初始检查成人内容状态
    checkAdultAPIsSelected();
}

// 添加成人API列表
function addAdultAPI() {
    // 仅在隐藏设置为false时添加成人API组
    if (!HIDE_BUILTIN_ADULT_APIS && (localStorage.getItem('yellowFilterEnabled') === 'false')) {
        const container = document.getElementById('apiCheckboxes');

        // 添加成人API组标题
        const adultdiv = document.createElement('div');
        adultdiv.id = 'adultdiv';
        adultdiv.className = 'grid grid-cols-2 gap-2';
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>`;
        adultdiv.appendChild(adultTitle);

        // 创建成人API源的复选框
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return; // 仅添加成人内容API

            const checked = selectedAPIs.includes(apiKey);

            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center';
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
            `;
            adultdiv.appendChild(checkbox);

            // 添加事件监听器
            checkbox.querySelector('input').addEventListener('change', function () {
                updateSelectedAPIs();
                checkAdultAPIsSelected();
            });
        });
        container.appendChild(adultdiv);
    }
}

// 检查是否有成人API被选中
function checkAdultAPIsSelected() {
    // 查找所有内置成人API复选框
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');

    // 查找所有自定义成人API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');

    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;

    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');

    // 如果选择了成人API，禁用黄色内容过滤器
    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');

        // 添加禁用样式
        yellowFilterContainer.classList.add('filter-disabled');

        // 修改描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
        }

        // 移除提示信息（如果存在）
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    } else {
        // 启用黄色内容过滤器
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');

        // 恢复原来的描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
        }

        // 移除提示信息
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
}

// 渲染自定义API列表
function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;

    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }

    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        // 新增 detail 地址显示
        const detailLine = api.detail ? `<div class="text-xs text-gray-400 truncate">detail: ${api.detail}</div>` : '';
        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                       class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                       ${selectedAPIs.includes('custom_' + index) ? 'checked' : ''} 
                       data-custom-index="${index}">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                    ${detailLine}
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        apiItem.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
}

// 编辑自定义API
function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const api = customAPIs[index];
    document.getElementById('customApiName').value = api.name;
    document.getElementById('customApiUrl').value = api.url;
    document.getElementById('customApiDetail').value = api.detail || '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = api.isAdult || false;
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

// 更新自定义API
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) url = url.slice(0, -1);
    // 保存 detail 字段
    customAPIs[index] = { name, url, detail, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    renderCustomAPIsList();
    checkAdultAPIsSelected();
    restoreAddCustomApiButtons();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已更新自定义API: ' + name, 'success');
}

// 取消编辑自定义API
function cancelEditCustomApi() {
    // 清空表单
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('customApiDetail').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;

    // 隐藏表单
    document.getElementById('addCustomApiForm').classList.add('hidden');

    // 恢复添加按钮
    restoreAddCustomApiButtons();
}

// 恢复自定义API添加按钮
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input:checked');

    // 获取选中的内置API
    const builtInApis = Array.from(builtInApiCheckboxes).map(input => input.dataset.api);

    // 获取选中的自定义API
    const customApiCheckboxes = document.querySelectorAll('#customApisList input:checked');
    const customApiIndices = Array.from(customApiCheckboxes).map(input => 'custom_' + input.dataset.customIndex);

    // 合并内置和自定义API
    selectedAPIs = [...builtInApis, ...customApiIndices];

    // 保存到localStorage
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 更新显示选中的API数量
    updateSelectedApiCount();
}

// 更新选中的API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 全选或取消全选API
function selectAllAPIs(selectAll = true, excludeAdult = false) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (excludeAdult && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });

    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
    }
}

// 取消添加自定义API - 修改函数来重用恢复按钮逻辑
function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        document.getElementById('customApiDetail').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) isAdultInput.checked = false;

        // 确保按钮是添加按钮
        restoreAddCustomApiButtons();
    }
}

// 添加自定义API
function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // 保存 detail 字段
    customAPIs.push({ name, url, detail, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已添加自定义API: ' + name, 'success');
}

// 移除自定义API
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;

    const apiName = customAPIs[index].name;

    // 从列表中移除API
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));

    // 从选中列表中移除此API
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);

    // 更新大于此索引的自定义API索引
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex > index) {
                return 'custom_' + (currentIndex - 1);
            }
        }
        return id;
    });

    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();

    // 更新选中的API数量
    updateSelectedApiCount();

    // 重新检查成人API选中状态
    checkAdultAPIsSelected();

    showToast('已移除自定义API: ' + apiName, 'info');
}

function toggleSettings(e) {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;

    if (settingsPanel.classList.contains('show')) {
        settingsPanel.classList.remove('show');
    } else {
        settingsPanel.classList.add('show');
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 点击外部关闭设置面板和历史记录面板
    document.addEventListener('click', function (e) {
        // 关闭设置面板
        const settingsPanel = document.querySelector('#settingsPanel.show');
        const settingsButton = document.querySelector('#settingsPanel .close-btn');

        if (settingsPanel && settingsButton &&
            !settingsPanel.contains(e.target) &&
            !settingsButton.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }

        // 关闭历史记录面板
        const historyPanel = document.querySelector('#historyPanel.show');
        const historyButton = document.querySelector('#historyPanel .close-btn');

        if (historyPanel && historyButton &&
            !historyPanel.contains(e.target) &&
            !historyButton.contains(e.target)) {
            historyPanel.classList.remove('show');
        }
    });

    // 黄色内容过滤开关事件绑定
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);

            // 控制黄色内容接口的显示状态
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                if (e.target.checked === true) {
                    adultdiv.style.display = 'none';
                } else if (e.target.checked === false) {
                    adultdiv.style.display = ''
                }
            } else {
                // 添加成人API列表
                addAdultAPI();
            }
        });
    }

    // 广告过滤开关事件绑定
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';

    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');

    // 确保页脚正确显示，移除相对定位
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }

    // 如果有豆瓣功能，检查是否需要显示豆瓣推荐区域
    if (typeof updateDoubanVisibility === 'function') {
        updateDoubanVisibility();
    }

    // 重置URL为主页
    try {
        window.history.pushState(
            {},
            `自由影界 - 免费在线视频搜索与观看平台`,
            `/`
        );
        // 更新页面标题
        document.title = `自由影界 - 免费在线视频搜索与观看平台`;
    } catch (e) {
        console.error('更新浏览器历史失败:', e);
    }
}

// 获取自定义API信息
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

// 搜索功能 - 修改为支持多选API和多页结果
async function search() {
    // 强化的密码保护校验 - 防止绕过
    try {
        if (window.ensurePasswordProtection) {
            window.ensurePasswordProtection();
        } else {
            // 兼容性检查
            if (window.isPasswordProtected && window.isPasswordVerified) {
                if (window.isPasswordProtected() && !window.isPasswordVerified()) {
                    showPasswordModal && showPasswordModal();
                    return;
                }
            }
        }
    } catch (error) {
        console.warn('Password protection check failed:', error.message);
        return;
    }
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }

    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个API源', 'warning');
        return;
    }

    showLoading();

    const searchArea = document.getElementById('searchArea');
    const resultsArea = document.getElementById('resultsArea');
    const doubanArea = document.getElementById('doubanArea');
    const resultsDiv = document.getElementById('results');
    const searchResultsCount = document.getElementById('searchResultsCount');

    // 初始化聚合状态
    searchAggregatedResults = [];
    currentDetailSources = [];
    currentDetailSourceIndex = 0;
    currentDetailEntryTitle = '';

    const aggregatedMap = new Map();
    const errors = [];
    let historyUpdated = false;
    let hasRenderedResults = false;
    const strategyConfig = window.SEARCH_STRATEGY_CONFIG || {};
    const defaultPrimarySource = window.DEFAULT_PRIMARY_SOURCE;
    const availableSources = [...selectedAPIs];
    const orderedSources = [];

    if (defaultPrimarySource && availableSources.includes(defaultPrimarySource)) {
        orderedSources.push(defaultPrimarySource);
    }

    availableSources.forEach(apiId => {
        if (!orderedSources.includes(apiId)) {
            orderedSources.push(apiId);
        }
    });

    const pendingSources = new Set(orderedSources);
    let totalSources = orderedSources.length;
    const initialBatchSize = Math.max(1, Math.min((strategyConfig.initialBatchSize ?? 1), orderedSources.length));
    const maxConcurrentRequests = Math.max(1, strategyConfig.maxConcurrentRequests ?? 4);
    const secondaryBatchDelay = Math.max(0, strategyConfig.secondaryBatchDelay ?? 0);
    const primarySources = orderedSources.slice(0, initialBatchSize);
    const secondarySources = orderedSources.slice(initialBatchSize);
    const getSourceDisplayName = (apiId) => {
        if (!apiId) return '首选资源';
        if (apiId.startsWith('custom_')) {
            const customInfo = getCustomApiInfo(apiId.replace('custom_', ''));
            return customInfo?.name || '自定义源';
        }
        return API_SITES[apiId]?.name || apiId;
    };
    const hideLoadingOnce = (() => {
        let hidden = false;
        return () => {
            if (!hidden) {
                hideLoading();
                hidden = true;
            }
        };
    })();

    const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
    const bannedCategories = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];

    const renderPlaceholder = (message) => {
        resultsDiv.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400 text-sm">${message}</div>
        `;
    };
    const renderStatusPlaceholder = (message, includeProgress = true) => {
        let finalMessage = message;
        if (includeProgress && totalSources > 0) {
            const completed = totalSources - pendingSources.size;
            finalMessage += `（已完成 ${completed}/${totalSources}）`;
        }
        renderPlaceholder(finalMessage);
    };

    const renderNoResults = () => {
        resultsDiv.innerHTML = `
            <div class="col-span-full text-center py-16">
                <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
            </div>
        `;
    };

    const updateResultsUI = () => {
        const sortedResults = getSortedAggregatedResults(aggregatedMap);
        searchAggregatedResults = sortedResults;

        if (searchResultsCount) {
            searchResultsCount.textContent = sortedResults.length;
        }

        if (sortedResults.length === 0) {
            if (pendingSources.size === 0) {
                renderNoResults();
            } else if (!hasRenderedResults) {
                renderStatusPlaceholder('正在聚合各数据源的搜索结果...');
            }
            return;
        }

        hasRenderedResults = true;
        resultsDiv.innerHTML = sortedResults
            .map((entry, index) => renderSearchResultCard(entry, index))
            .join('');

        if (!historyUpdated) {
            try {
                const encodedQuery = encodeURIComponent(query);
                window.history.pushState(
                    { search: query },
                    `搜索: ${query} - 自由影界`,
                    `/s=${encodedQuery}`
                );
                document.title = `搜索: ${query} - 自由影界`;
                historyUpdated = true;
            } catch (e) {
                console.error('更新浏览器历史失败:', e);
            }
        }
    };

    const handleSourceSearch = async (apiId) => {
        let shouldUpdate = true;
        try {
            const results = await searchByAPIAndKeyWord(apiId, query);
            if (!Array.isArray(results) || results.length === 0) {
                return;
            }

            let filteredResults = results;
            if (yellowFilterEnabled) {
                filteredResults = results.filter(item => {
                    const typeName = item.type_name || '';
                    return !bannedCategories.some(keyword => typeName.includes(keyword));
                });
            }

            if (filteredResults.length === 0) {
                return;
            }

            const hasChanges = mergeAggregatedResults(aggregatedMap, filteredResults);
            shouldUpdate = hasChanges || !hasRenderedResults;
        } catch (error) {
            errors.push({ apiId, error });
            console.error(`搜索源 ${apiId} 发生错误:`, error);
        } finally {
            pendingSources.delete(apiId);
            if (shouldUpdate || pendingSources.size === 0 || !hasRenderedResults) {
                updateResultsUI();
            }
        }
    };

    const processQueue = async (sourceIds) => {
        if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
            return;
        }

        const concurrency = Math.max(1, Math.min(maxConcurrentRequests, sourceIds.length));
        let currentIndex = 0;

        const worker = async () => {
            while (true) {
                const index = currentIndex++;
                if (index >= sourceIds.length) {
                    break;
                }
                const apiId = sourceIds[index];
                await handleSourceSearch(apiId);
            }
        };

        const workers = [];
        for (let i = 0; i < concurrency; i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
    };

    // 显示结果区域并隐藏豆瓣推荐
    if (searchArea) {
        searchArea.classList.remove('flex-1');
        searchArea.classList.add('mb-8');
    }
    if (resultsArea) {
        resultsArea.classList.remove('hidden');
    }
    if (doubanArea) {
        doubanArea.classList.add('hidden');
    }

    const primarySourceName = primarySources.length > 0 ? getSourceDisplayName(primarySources[0]) : '首选资源';
    renderStatusPlaceholder(`正在优先使用${primarySourceName}搜索，请稍候...`, false);

    try {
        // 保存搜索历史
        saveSearchHistory(query);

        await processQueue(primarySources);

        hideLoadingOnce();

        const hasPrimaryResults = aggregatedMap.size > 0;

        if (hasPrimaryResults && secondarySources.length > 0) {
            secondarySources.forEach(apiId => pendingSources.delete(apiId));
            totalSources = totalSources - secondarySources.length;
        }

        if (!hasPrimaryResults && secondarySources.length > 0 && !hasRenderedResults) {
            renderStatusPlaceholder('首选资源暂无结果，正在尝试其他数据源...');
        }

        if (secondarySources.length > 0 && !hasPrimaryResults) {
            if (secondaryBatchDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, secondaryBatchDelay));
            }
            await processQueue(secondarySources);
        }

        if (!hasRenderedResults) {
            updateResultsUI();
        }

        if (errors.length > 0) {
            const message = hasRenderedResults ? '部分数据源搜索失败，结果已根据可用资源显示' : '搜索失败，请稍后重试';
            showToast(message, hasRenderedResults ? 'warning' : 'error');
        }
    } catch (error) {
        console.error('搜索错误:', error);
        hideLoadingOnce();
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoadingOnce();
    }
}

function getSortedAggregatedResults(aggregatedMap) {
    return Array.from(aggregatedMap.values()).sort((a, b) => {
        const nameA = (a.primary?.vod_name || '').toString();
        const nameB = (b.primary?.vod_name || '').toString();
        const nameCompare = nameA.localeCompare(nameB);
        if (nameCompare !== 0) {
            return nameCompare;
        }
        const yearA = parseInt(a.primary?.vod_year, 10) || 0;
        const yearB = parseInt(b.primary?.vod_year, 10) || 0;
        return yearB - yearA;
    });
}

function createAggregationKey(item) {
    const name = (item.vod_name || '').toString().trim().toLowerCase();
    const year = (item.vod_year || '').toString().trim();
    const type = (item.type_name || '').toString().trim().toLowerCase();
    if (!name) return '';
    return `${name}__${year || 'unknown'}__${type || 'general'}`;
}

function getPrimaryScore(item) {
    if (!item) return 0;
    let score = 0;
    if (item.vod_pic) score += 3;
    if (item.vod_remarks && item.vod_remarks !== '暂无介绍') score += 2;
    if (item.vod_year) score += 1;
    if (item.type_name) score += 0.5;
    return score;
}

function mergeAggregatedResults(aggregatedMap, items) {
    let changed = false;

    items.forEach(item => {
        if (!item || !item.vod_name) return;

        const key = createAggregationKey(item);
        if (!key) return;

        const sourceEntry = {
            source_code: item.source_code || '',
            source_name: item.source_name || '',
            vod_id: item.vod_id,
            api_url: item.api_url || '',
            vod_name: item.vod_name || '',
            vod_pic: item.vod_pic || '',
            vod_year: item.vod_year || '',
            vod_remarks: item.vod_remarks || '',
            type_name: item.type_name || '',
            vod_area: item.vod_area || '',
            vod_actor: item.vod_actor || '',
            raw: item
        };

        if (!aggregatedMap.has(key)) {
            aggregatedMap.set(key, {
                key,
                primary: { ...item },
                sources: [sourceEntry]
            });
            changed = true;
            return;
        }

        const entry = aggregatedMap.get(key);
        const alreadyExists = entry.sources.some(src =>
            src.source_code === sourceEntry.source_code && String(src.vod_id) === String(sourceEntry.vod_id)
        );

        if (!alreadyExists) {
            entry.sources.push(sourceEntry);
            changed = true;
        }

        if (getPrimaryScore(item) > getPrimaryScore(entry.primary)) {
            entry.primary = { ...item };
            changed = true;
        } else {
            if (!entry.primary.vod_pic && item.vod_pic) {
                entry.primary.vod_pic = item.vod_pic;
                changed = true;
            }
            if ((!entry.primary.vod_remarks || entry.primary.vod_remarks === '暂无介绍') && item.vod_remarks) {
                entry.primary.vod_remarks = item.vod_remarks;
                changed = true;
            }
            if (!entry.primary.type_name && item.type_name) {
                entry.primary.type_name = item.type_name;
                changed = true;
            }
            if (!entry.primary.vod_year && item.vod_year) {
                entry.primary.vod_year = item.vod_year;
                changed = true;
            }
        }
    });

    return changed;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderSearchResultCard(entry, index) {
    const item = entry.primary || {};
    const hasCover = item.vod_pic && item.vod_pic.startsWith('http');
    const displayName = escapeHtml(item.vod_name || entry.sources?.[0]?.vod_name || '未知视频');
    const typeName = escapeHtml(item.type_name || '');
    const year = escapeHtml(item.vod_year || '');
    const remarks = escapeHtml(item.vod_remarks || '暂无介绍');
    const shouldShowSourceBadges = Boolean(window.AGGREGATED_SEARCH_CONFIG?.showSourceBadges);

    const coverHtml = hasCover ? `
        <div class="relative flex-shrink-0 search-card-img-container">
            <img src="${item.vod_pic}" alt="${displayName}"
                 class="h-full w-full object-cover transition-transform hover:scale-110"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=无封面'; this.classList.add('object-contain');"
                 loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
        </div>
    ` : '';

    let sourcesFooterHtml = '';
    if (shouldShowSourceBadges) {
        const sourceBadges = entry.sources
            .map(src => escapeHtml(src.source_name || src.source_code || '未知资源'))
            .slice(0, 3)
            .map(name => `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${name}</span>`)
            .join('');

        const extraCount = entry.sources.length - 3;
        const extraBadge = extraCount > 0 ? `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">+${extraCount}</span>` : '';

        sourcesFooterHtml = `
                    <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mt-1 pt-1 border-t border-gray-800">
                        ${sourceBadges}${extraBadge}
                    </div>
        `;
    }

    return `
        <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md"
             onclick="handleSearchResultClick(${index})">
            <div class="flex h-full">
                ${coverHtml}
                <div class="p-2 flex flex-col flex-grow">
                    <div class="flex-grow">
                        <h3 class="font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${displayName}">${displayName}</h3>
                        <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                            ${typeName ? `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">${typeName}</span>` : ''}
                            ${year ? `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">${year}</span>` : ''}
                            ${entry.sources.length > 1 ? `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-emerald-500 text-emerald-300">共${entry.sources.length}个源</span>` : ''}
                        </div>
                        <p class="text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2">${remarks || '暂无介绍'}</p>
                    </div>
                    ${sourcesFooterHtml}
                </div>
            </div>
        </div>
    `;
}

function handleSearchResultClick(resultIndex, sourceIndex = 0) {
    const entry = searchAggregatedResults[resultIndex];
    if (!entry || !entry.sources || entry.sources.length === 0) {
        showToast('未找到可用资源', 'error');
        return;
    }

    if (sourceIndex < 0 || sourceIndex >= entry.sources.length) {
        sourceIndex = 0;
    }

    currentDetailSources = entry.sources;
    currentDetailSourceIndex = sourceIndex;
    currentDetailEntryTitle = entry.primary?.vod_name || entry.sources[sourceIndex].vod_name || '未知视频';

    const selectedSource = entry.sources[sourceIndex];
    showDetails(selectedSource.vod_id, currentDetailEntryTitle, selectedSource.source_code);
}

function renderDetailSourceSwitcher() {
    if (!currentDetailSources || currentDetailSources.length <= 1) {
        return '';
    }

    return `
        <div class="flex flex-wrap gap-2 mb-4">
            ${currentDetailSources.map((src, idx) => {
                const isActive = idx === currentDetailSourceIndex;
                const label = escapeHtml(src.source_name || src.source_code || `资源${idx + 1}`);
                return `<button class="px-2 py-1 rounded text-xs border ${isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-blue-500'}" onclick="switchDetailSource(${idx})">${label}</button>`;
            }).join('')}
        </div>
    `;
}

function switchDetailSource(targetIndex) {
    if (!currentDetailSources || targetIndex < 0 || targetIndex >= currentDetailSources.length) {
        return;
    }

    if (targetIndex === currentDetailSourceIndex) {
        return;
    }

    const target = currentDetailSources[targetIndex];
    if (!target) {
        showToast('未找到目标资源', 'error');
        return;
    }

    currentDetailSourceIndex = targetIndex;
    currentDetailEntryTitle = target.vod_name || currentDetailEntryTitle;
    showDetails(target.vod_id, currentDetailEntryTitle, target.source_code);
}

// 切换清空按钮的显示状态
function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    if (searchInput.value !== '') {
        clearButton.classList.remove('hidden');
    } else {
        clearButton.classList.add('hidden');
    }
}

// 清空搜索框内容
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    const clearButton = document.getElementById('clearSearchInput');
    clearButton.classList.add('hidden');
}

// 劫持搜索框的value属性以检测外部修改
function hookInput() {
    const input = document.getElementById('searchInput');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    // 重写 value 属性的 getter 和 setter
    Object.defineProperty(input, 'value', {
        get: function () {
            // 确保读取时返回字符串（即使原始值为 undefined/null）
            const originalValue = descriptor.get.call(this);
            return originalValue != null ? String(originalValue) : '';
        },
        set: function (value) {
            // 显式将值转换为字符串后写入
            const strValue = String(value);
            descriptor.set.call(this, strValue);
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // 初始化输入框值为空字符串（避免初始值为 undefined）
    input.value = '';
}
document.addEventListener('DOMContentLoaded', hookInput);

// 显示详情 - 修改为支持自定义API
async function showDetails(id, vod_name, sourceCode) {
    // 密码保护校验
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    if (!id) {
        showToast('视频ID无效', 'error');
        return;
    }

    if (vod_name) {
        currentDetailEntryTitle = vod_name;
    } else if (currentDetailEntryTitle) {
        vod_name = currentDetailEntryTitle;
    }

    showLoading();
    try {
        // 构建API参数
        let apiParams = '';

        // 处理自定义API源
        if (sourceCode.startsWith('custom_')) {
            const customIndex = sourceCode.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                showToast('自定义API配置无效', 'error');
                hideLoading();
                return;
            }
            // 传递 detail 字段
            if (customApi.detail) {
                apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&customDetail=' + encodeURIComponent(customApi.detail) + '&source=custom';
            } else {
                apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&source=custom';
            }
        } else {
            // 内置API
            apiParams = '&source=' + sourceCode;
        }

        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const cacheBuster = `&_t=${timestamp}`;
        const response = await fetch(`/api/detail?id=${encodeURIComponent(id)}${apiParams}${cacheBuster}`);

        const data = await response.json();

        const detailSource = {
            source_code: sourceCode,
            source_name: data?.videoInfo?.source_name || currentDetailSources?.[currentDetailSourceIndex]?.source_name || sourceCode,
            vod_id: id,
            vod_name: vod_name || data?.videoInfo?.name || data?.videoInfo?.vod_name || '',
            vod_pic: data?.videoInfo?.pic || data?.videoInfo?.vod_pic || data?.videoInfo?.cover || '',
            vod_year: data?.videoInfo?.year || data?.videoInfo?.vod_year || '',
            vod_remarks: data?.videoInfo?.remarks || data?.videoInfo?.vod_remarks || '',
            type_name: data?.videoInfo?.type || '',
            vod_area: data?.videoInfo?.area || ''
        };

        if (!Array.isArray(currentDetailSources) || currentDetailSources.length === 0) {
            currentDetailSources = [detailSource];
            currentDetailSourceIndex = 0;
        } else {
            const existingIndex = currentDetailSources.findIndex(src =>
                src.source_code === detailSource.source_code && String(src.vod_id) === String(detailSource.vod_id)
            );
            if (existingIndex === -1) {
                currentDetailSources.push(detailSource);
                currentDetailSourceIndex = currentDetailSources.length - 1;
            } else {
                currentDetailSources[existingIndex] = { ...currentDetailSources[existingIndex], ...detailSource };
                currentDetailSourceIndex = existingIndex;
            }
        }

        currentDetailEntryTitle = detailSource.vod_name || currentDetailEntryTitle || vod_name || '未知视频';
        const displayTitle = currentDetailEntryTitle || vod_name || '未知视频';
        currentVideoTitle = displayTitle;

        if (data.episodes && data.episodes.length > 0) {
            currentEpisodes = data.episodes;
            currentEpisodeIndex = 0;

            const descriptionText = data.videoInfo?.desc ? data.videoInfo.desc.replace(/<[^>]+>/g, '').trim() : '';
            const detailMeta = {
                title: displayTitle,
                sourceName: detailSource.source_name || '',
                sourceCode: detailSource.source_code || '',
                year: data.videoInfo?.year || '',
                type: data.videoInfo?.type || '',
                area: data.videoInfo?.area || '',
                director: data.videoInfo?.director || '',
                actor: data.videoInfo?.actor || '',
                remarks: data.videoInfo?.remarks || '',
                desc: descriptionText || '',
                pic: detailSource.vod_pic || '',
                vod_id: id
            };

            try {
                localStorage.setItem('currentVideoDetail', JSON.stringify(detailMeta));
            } catch (e) {
                console.warn('保存视频详情失败:', e);
            }

            const firstEpisode = data.episodes[0];
            if (!firstEpisode) {
                showToast('未找到播放资源', 'error');
                return;
            }

            playVideo(firstEpisode, displayTitle, sourceCode, 0, id);
        } else {
            showToast('未找到播放资源', 'error');
        }
    } catch (error) {
        console.error('获取详情错误:', error);
        showToast('获取详情失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 更新播放视频函数，直接跳转到播放器页面并保留上下文
function playVideo(url, vod_name, sourceCode, episodeIndex = 0, vodId = '') {
    // 密码保护校验
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }

    const currentPath = window.location.href;
    const playerUrl = new URL('player.html', window.location.origin);

    if (vodId) {
        playerUrl.searchParams.set('id', vodId);
    }
    if (sourceCode) {
        playerUrl.searchParams.set('source', sourceCode);
    }
    if (url) {
        playerUrl.searchParams.set('url', url);
    }
    playerUrl.searchParams.set('index', episodeIndex);
    if (vod_name) {
        playerUrl.searchParams.set('title', vod_name);
    }
    playerUrl.searchParams.set('returnUrl', currentPath);

    if (Array.isArray(currentEpisodes) && currentEpisodes.length > 0) {
        playerUrl.searchParams.set('episodes', JSON.stringify(currentEpisodes));
    }

    try {
        localStorage.setItem('currentVideoTitle', vod_name || '未知视频');
        localStorage.setItem('currentEpisodes', JSON.stringify(currentEpisodes));
        localStorage.setItem('currentEpisodeIndex', episodeIndex);
        localStorage.setItem('currentSourceCode', sourceCode || '');
        localStorage.setItem('lastPlayTime', Date.now());
        localStorage.setItem('lastSearchPage', currentPath);
        localStorage.setItem('lastPageUrl', currentPath);
        if (Array.isArray(currentDetailSources) && currentDetailSources.length > 0) {
            localStorage.setItem('currentAvailableSources', JSON.stringify(currentDetailSources));
            localStorage.setItem('currentAvailableSourceIndex', currentDetailSourceIndex);
        } else {
            localStorage.removeItem('currentAvailableSources');
            localStorage.removeItem('currentAvailableSourceIndex');
        }
    } catch (e) {
        console.error('保存播放状态失败:', e);
    }

    window.location.href = playerUrl.toString();
}

// 弹出播放器页面
function showVideoPlayer(url) {
    // 在打开播放器前，隐藏详情弹窗
    const detailModal = document.getElementById('modal');
    if (detailModal) {
        detailModal.classList.add('hidden');
    }
    // 临时隐藏搜索结果和豆瓣区域，防止高度超出播放器而出现滚动条
    document.getElementById('resultsArea').classList.add('hidden');
    document.getElementById('doubanArea').classList.add('hidden');
    // 在框架中打开播放页面
    videoPlayerFrame = document.createElement('iframe');
    videoPlayerFrame.id = 'VideoPlayerFrame';
    videoPlayerFrame.className = 'fixed w-full h-screen z-40';
    videoPlayerFrame.src = url;
    document.body.appendChild(videoPlayerFrame);
    // 将焦点移入iframe
    videoPlayerFrame.focus();
}

// 关闭播放器页面
function closeVideoPlayer(home = false) {
    videoPlayerFrame = document.getElementById('VideoPlayerFrame');
    if (videoPlayerFrame) {
        videoPlayerFrame.remove();
        // 恢复搜索结果显示
        document.getElementById('resultsArea').classList.remove('hidden');
        // 关闭播放器时也隐藏详情弹窗
        const detailModal = document.getElementById('modal');
        if (detailModal) {
            detailModal.classList.add('hidden');
        }
        // 如果启用豆瓣区域则显示豆瓣区域
        if (localStorage.getItem('doubanEnabled') === 'true') {
            document.getElementById('doubanArea').classList.remove('hidden');
        }
    }
    if (home) {
        // 刷新主页
        window.location.href = '/'
    }
}

// 播放上一集
function playPreviousEpisode(sourceCode) {
    if (currentEpisodeIndex > 0) {
        const prevIndex = currentEpisodeIndex - 1;
        const prevUrl = currentEpisodes[prevIndex];
        playVideo(prevUrl, currentVideoTitle, sourceCode, prevIndex);
    }
}

// 播放下一集
function playNextEpisode(sourceCode) {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        const nextIndex = currentEpisodeIndex + 1;
        const nextUrl = currentEpisodes[nextIndex];
        playVideo(nextUrl, currentVideoTitle, sourceCode, nextIndex);
    }
}

// 处理播放器加载错误
function handlePlayerError() {
    hideLoading();
    showToast('视频播放加载失败，请尝试其他视频源', 'error');
}

// 辅助函数用于渲染剧集按钮（使用当前的排序状态）
function renderEpisodes(vodName, sourceCode, vodId) {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    return episodes.map((episode, index) => {
        // 根据倒序状态计算真实的剧集索引
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        return `
            <button id="episode-${realIndex}" onclick="playVideo('${episode}','${vodName.replace(/"/g, '&quot;')}', '${sourceCode}', ${realIndex}, '${vodId}')" 
                    class="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center episode-btn">
                ${realIndex + 1}
            </button>
        `;
    }).join('');
}

// 复制视频链接到剪贴板
function copyLinks() {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    const linkList = episodes.join('\r\n');
    navigator.clipboard.writeText(linkList).then(() => {
        showToast('播放链接已复制', 'success');
    }).catch(err => {
        showToast('复制失败，请检查浏览器权限', 'error');
    });
}

// 切换排序状态的函数
function toggleEpisodeOrder(sourceCode, vodId) {
    episodesReversed = !episodesReversed;
    // 重新渲染剧集区域，使用 currentVideoTitle 作为视频标题
    const episodesGrid = document.getElementById('episodesGrid');
    if (episodesGrid) {
        episodesGrid.innerHTML = renderEpisodes(currentVideoTitle, sourceCode, vodId);
    }

    // 更新按钮文本和箭头方向
    const toggleBtn = document.querySelector(`button[onclick="toggleEpisodeOrder('${sourceCode}', '${vodId}')"]`);
    if (toggleBtn) {
        toggleBtn.querySelector('span').textContent = episodesReversed ? '正序排列' : '倒序排列';
        const arrowIcon = toggleBtn.querySelector('svg');
        if (arrowIcon) {
            arrowIcon.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

// 从URL导入配置
async function importConfigFromUrl() {
    // 创建模态框元素
    let modal = document.getElementById('importUrlModal');
    if (modal) {
        document.body.removeChild(modal);
    }

    modal = document.createElement('div');
    modal.id = 'importUrlModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';

    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeUrlModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <h3 class="text-xl font-bold mb-4">从URL导入配置</h3>
            
            <div class="mb-4">
                <input type="text" id="configUrl" placeholder="输入配置文件URL" 
                       class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            
            <div class="flex justify-end space-x-2">
                <button id="confirmUrlImport" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">导入</button>
                <button id="cancelUrlImport" class="bg-[#444] hover:bg-[#555] text-white px-4 py-2 rounded">取消</button>
            </div>
        </div>`;

    document.body.appendChild(modal);

    // 关闭按钮事件
    document.getElementById('closeUrlModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 取消按钮事件
    document.getElementById('cancelUrlImport').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 确认导入按钮事件
    document.getElementById('confirmUrlImport').addEventListener('click', async () => {
        const url = document.getElementById('configUrl').value.trim();
        if (!url) {
            showToast('请输入配置文件URL', 'warning');
            return;
        }

        // 验证URL格式
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                showToast('URL必须以http://或https://开头', 'warning');
                return;
            }
        } catch (e) {
            showToast('URL格式不正确', 'warning');
            return;
        }

        showLoading('正在从URL导入配置...');

        try {
            // 获取配置文件 - 直接请求URL
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw '获取配置文件失败';

            // 验证响应内容类型
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw '响应不是有效的JSON格式';
            }

            const config = await response.json();
            if (config.name !== '自由影界-Settings') throw '配置文件格式不正确';

            // 验证哈希
            const dataHash = await sha256(JSON.stringify(config.data));
            if (dataHash !== config.hash) throw '配置文件哈希值不匹配';

            // 导入配置
            for (let item in config.data) {
                localStorage.setItem(item, config.data[item]);
            }

            showToast('配置文件导入成功，3 秒后自动刷新本页面。', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            const message = typeof error === 'string' ? error : '导入配置失败';
            showToast(`从URL导入配置出错 (${message})`, 'error');
        } finally {
            hideLoading();
            document.body.removeChild(modal);
        }
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 配置文件导入功能
async function importConfig() {
    showImportBox(async (file) => {
        try {
            // 检查文件类型
            if (!(file.type === 'application/json' || file.name.endsWith('.json'))) throw '文件类型不正确';

            // 检查文件大小
            if (file.size > 1024 * 1024 * 10) throw new Error('文件大小超过 10MB');

            // 读取文件内容
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject('文件读取失败');
                reader.readAsText(file);
            });

            // 解析并验证配置
            const config = JSON.parse(content);
            if (config.name !== '自由影界-Settings') throw '配置文件格式不正确';

            // 验证哈希
            const dataHash = await sha256(JSON.stringify(config.data));
            if (dataHash !== config.hash) throw '配置文件哈希值不匹配';

            // 导入配置
            for (let item in config.data) {
                localStorage.setItem(item, config.data[item]);
            }

            showToast('配置文件导入成功，3 秒后自动刷新本页面。', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            const message = typeof error === 'string' ? error : '配置文件格式错误';
            showToast(`配置文件读取出错 (${message})`, 'error');
        }
    });
}

// 配置文件导出功能
async function exportConfig() {
    // 存储配置数据
    const config = {};
    const items = {};

    const settingsToExport = [
        'selectedAPIs',
        'customAPIs',
        'yellowFilterEnabled',
        'adFilteringEnabled',
        'doubanEnabled',
        'hasInitializedDefaults'
    ];

    // 导出设置项
    settingsToExport.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            items[key] = value;
        }
    });

    // 导出历史记录
    const viewingHistory = localStorage.getItem('viewingHistory');
    if (viewingHistory) {
        items['viewingHistory'] = viewingHistory;
    }

    const searchHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (searchHistory) {
        items[SEARCH_HISTORY_KEY] = searchHistory;
    }

    const times = Date.now().toString();
    config['name'] = '自由影界-Settings';  // 配置文件名，用于校验
    config['time'] = times;               // 配置文件生成时间
    config['cfgVer'] = '1.0.0';           // 配置文件版本
    config['data'] = items;               // 配置文件数据
    config['hash'] = await sha256(JSON.stringify(config['data']));  // 计算数据的哈希值，用于校验

    // 将配置数据保存为 JSON 文件
    saveStringAsFile(JSON.stringify(config), '自由影界-Settings_' + times + '.json');
}

// 将字符串保存为文件
function saveStringAsFile(content, fileName) {
    // 创建Blob对象并指定类型
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    // 生成临时URL
    const url = window.URL.createObjectURL(blob);
    // 创建<a>标签并触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    // 清理临时对象
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 移除Node.js的require语句，因为这是在浏览器环境中运行的
