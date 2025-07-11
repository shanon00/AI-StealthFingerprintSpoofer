// ==UserScript==
// @name         SFCF Stealth Fingerprint Spoofer for CF - Firefox 127 Enhanced v6.0
// @namespace    http://tampermonkey.net
// @version      6.0
// @description  增强版Firefox 127指纹伪装，优化指纹一致性与反检测能力，适配Cloudflare
// @author       优化版
// @match        *://*/*
// @grant        none
// @run-at       document-start  // 最早时机执行，避免初始指纹泄露
// ==/UserScript==

(function() {
    'use strict';

    // Firefox 127核心配置（确保与UA完全匹配）
    const config = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        platform: 'Win32',  // Firefox 127在64位Windows上仍返回Win32
        language: 'zh-CN',  // 可根据需求改为en-US等
        languages: ['zh-CN', 'zh', 'en-US', 'en'],  // 符合真实浏览器语言优先级
        screen: {
            width: 1920 + Math.floor(Math.random() * 200),  // 随机1920-2120px（避免固定值）
            height: 1080 + Math.floor(Math.random() * 100), // 随机1080-1180px
            colorDepth: 24,
            pixelRatio: 1 + Math.floor(Math.random() * 2)  // 1.0或2.0（常见缩放比例）
        },
        hardwareConcurrency: 4 + Math.floor(Math.random() * 8),  // 4-12核（真实PC范围）
        timezoneOffset: -480,  // 中国时区（UTC+8），可根据IP调整
        vendor: '',  // Firefox无vendor信息
        product: 'Gecko',
        renderer: 'ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',  // 常见Intel显卡渲染信息
        fonts: [  // Firefox 127默认字体（Windows）
            'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
            'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS',
            'Verdana', 'Microsoft YaHei', 'SimSun', 'SimHei'  // 包含中文字体（符合中文环境）
        ]
    };

    // 安全定义属性（避免原型链污染检测）
    const safeDefine = (obj, prop, value) => {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            Object.defineProperty(obj, prop, {
                value: value,
                writable: false,
                configurable: false,
                enumerable: true
            });
        }
    };

    // 1. 强化Navigator属性（严格匹配Firefox 127）
    const fakeNavigator = {
        userAgent: config.userAgent,
        appVersion: config.userAgent,
        platform: config.platform,
        language: config.language,
        languages: config.languages,
        hardwareConcurrency: config.hardwareConcurrency,
        webdriver: false,  // 关键：隐藏自动化标识
        vendor: config.vendor,
        product: config.product,
        appCodeName: 'Mozilla',
        appName: 'Netscape',
        onLine: true,
        vendorSub: '',
        productSub: '20100101',  // Firefox固定值
        maxTouchPoints: 0,  // 桌面设备无触摸
        doNotTrack: null,
        pdfViewerEnabled: true,  // Firefox默认支持PDF
        deviceMemory: undefined,  // Firefox 127无此属性
        userAgentData: undefined,  // Firefox不支持userAgentData
        scheduling: undefined,
        userActivation: undefined,
        connection: {  // 模拟家庭网络（Firefox 127支持connection属性）
            type: 'wifi',
            effectiveType: '4g',
            rtt: 30 + Math.random() * 10,  // 30-40ms（家庭网络典型值）
            downlink: 50 + Math.random() * 30  // 50-80Mbps
        },
        chrome: undefined,  // Firefox无chrome属性
        // Firefox特有插件（严格匹配默认插件）
        plugins: Object.freeze([
            Object.freeze({
                name: 'PDF Viewer',
                filename: 'pdf.js',
                description: 'Portable Document Format viewer',
                length: 1,
                item: (i) => i === 0 ? { type: 'application/pdf', suffixes: 'pdf' } : null
            }),
            Object.freeze({
                name: 'Widevine Content Decryption Module',
                filename: 'widevinecdm.dll',
                description: 'Widevine CDM 4.10.2710.0',
                length: 1,
                item: (i) => i === 0 ? { type: 'application/x-ppapi-widevine-cdm', suffixes: '' } : null
            }),
            Object.freeze({
                name: 'OpenH264 Video Codec provided by Cisco Systems, Inc.',
                filename: 'openh264.dll',
                description: 'H.264/AVC video codec',
                length: 1,
                item: (i) => i === 0 ? { type: 'video/mp4', suffixes: 'mp4' } : null
            })
        ]),
        // 匹配插件的MIME类型
        mimeTypes: Object.freeze([
            Object.freeze({ type: 'application/pdf', suffixes: 'pdf', enabledPlugin: navigator.plugins[0] }),
            Object.freeze({ type: 'video/mp4', suffixes: 'mp4', enabledPlugin: navigator.plugins[2] }),
            Object.freeze({ type: 'application/x-ppapi-widevine-cdm', suffixes: '', enabledPlugin: navigator.plugins[1] })
        ]),
        // Firefox特有：扩展安装触发器
        InstallTrigger: {
            install: () => {},
            __proto__: { constructor: function InstallTrigger() {} }
        }
    };

    // 覆盖navigator属性（确保所有属性与Firefox一致）
    Object.keys(fakeNavigator).forEach(prop => {
        safeDefine(navigator, prop, fakeNavigator[prop]);
    });

    // 2. 屏幕信息优化（更真实的桌面显示）
    safeDefine(screen, 'width', config.screen.width);
    safeDefine(screen, 'height', config.screen.height);
    safeDefine(screen, 'availWidth', config.screen.width);
    safeDefine(screen, 'availHeight', config.screen.height - 40);  // 扣除任务栏高度
    safeDefine(screen, 'colorDepth', config.screen.colorDepth);
    safeDefine(screen, 'pixelDepth', config.screen.colorDepth);
    safeDefine(window, 'devicePixelRatio', config.screen.pixelRatio);  // 1.0或2.0（常见缩放）

    // 3. 时区伪装（不修改原型，避免检测）
    const originalDate = Date;
    Date = function(...args) {
        const date = new originalDate(...args);
        date.getTimezoneOffset = () => config.timezoneOffset;
        return date;
    };
    Date.prototype = originalDate.prototype;
    Date.now = originalDate.now;
    Date.parse = originalDate.parse;

    // 4. Canvas指纹扰动（细微且自然）
    const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, options) {
        const context = originalCanvasGetContext.call(this, type, options);
        if (type === '2d' && context) {
            const originalToDataURL = context.canvas.toDataURL;
            context.canvas.toDataURL = function() {
                // 随机扰动2-3个像素（避免过度修改）
                const imageData = context.getImageData(0, 0, this.width, this.height);
                const 扰动次数 = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < 扰动次数; i++) {
                    const pos = Math.floor(Math.random() * imageData.data.length);
                    // 轻微调整像素值（±1-2）
                    imageData.data[pos] = (imageData.data[pos] + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2))) % 256;
                }
                context.putImageData(imageData, 0, 0);
                return originalToDataURL.call(this);
            };
        }
        return context;
    };

    // 5. WebGL信息强化（匹配Firefox 127显卡特征）
    if (window.WebGLRenderingContext) {
        const originalWebGLGetParam = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(param) {
            const params = {
                0x9246: '',  // VENDOR（Firefox默认空）
                0x9247: config.renderer,  // RENDERER（模拟Intel显卡）
                0x1F00: 'WebGL 1.0',  // Firefox 127 WebGL版本
                0x1F01: 'OpenGL ES GLSL ES 1.00',
                0x930B: 'Intel',  // UNMASKED_VENDOR_WEBGL（显卡厂商）
                0x930C: 'Intel(R) UHD Graphics 630'  // 真实显卡型号
            };
            return params[param] || originalWebGLGetParam.call(this, param);
        };

        // Firefox 127支持的WebGL扩展（避免多余扩展）
        const originalGetExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
        WebGLRenderingContext.prototype.getSupportedExtensions = function() {
            const baseExtensions = originalGetExtensions.call(this) || [];
            // 筛选Firefox常见扩展，移除Safari特有扩展
            return baseExtensions.filter(ext => 
                !ext.includes('WEBGL_compressed_texture_astc')  // 非Firefox默认
            );
        };
    }

    // 6. 字体指纹优化（Firefox 127默认字体渲染）
    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function(text) {
        // 随机选择Firefox字体，字体大小模拟系统默认（14-16px）
        const font = config.fonts[Math.floor(Math.random() * config.fonts.length)];
        this.font = `${14 + Math.floor(Math.random() * 3)}px ${font}, sans-serif`;
        return originalMeasureText.call(this, text);
    };

    // 7. WebRTC彻底禁用（避免IP泄露）
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer', 'RTCIceCandidate'].forEach(key => {
        safeDefine(window, key, undefined);
    });

    // 8. 音频指纹微调（符合Firefox 127音频特征）
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const originalCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function() {
            const osc = originalCreateOscillator.call(this);
            // 更细微的频率扰动（0.005Hz内）
            osc.frequency.value += (Math.random() * 0.01 - 0.005);
            return osc;
        };
    }

    // 9. 行为模拟升级（自然人类轨迹）
    // 贝塞尔曲线生成鼠标轨迹（模拟加速度变化）
    function bezierCurve(start, end, controlPoints = 2) {
        const points = [start];
        // 生成随机控制点（模拟人类手部抖动）
        for (let i = 0; i < controlPoints; i++) {
            points.push({
                x: start.x + (end.x - start.x) * (i + 1) / (controlPoints + 1) + (Math.random() * 80 - 40),
                y: start.y + (end.y - start.y) * (i + 1) / (controlPoints + 1) + (Math.random() * 80 - 40)
            });
        }
        points.push(end);
        return (t) => {
            let x = 0, y = 0;
            const n = points.length - 1;
            for (let i = 0; i <= n; i++) {
                const binom = combinations(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
                x += binom * points[i].x;
                y += binom * points[i].y;
            }
            return { x, y };
        };
    }

    // 组合数计算（贝塞尔曲线辅助）
    function combinations(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        return combinations(n - 1, k - 1) + combinations(n - 1, k);
    }

    // 自然鼠标移动（带加速/减速）
    function simulateNaturalMouseMove() {
        const startX = 100 + Math.random() * 300;
        const startY = 100 + Math.random() * 300;
        const endX = 500 + Math.random() * 400;
        const endY = 400 + Math.random() * 300;
        const duration = 800 + Math.random() * 500;  // 800-1300ms（人类移动耗时）
        const curve = bezierCurve({ x: startX, y: startY }, { x: endX, y: endY });
        const start = Date.now();

        function moveStep() {
            const t = (Date.now() - start) / duration;
            if (t >= 1) return;
            // 模拟人类操作：先加速后减速（t^2*(3-2t)曲线）
            const easeT = t * t * (3 - 2 * t);
            const { x, y } = curve(easeT);
            document.dispatchEvent(new MouseEvent('mousemove', {
                bubbles: true,
                clientX: x,
                clientY: y,
                movementX: x - (window.lastMouseX || startX),
                movementY: y - (window.lastMouseY || startY)
            }));
            window.lastMouseX = x;
            window.lastMouseY = y;
            requestAnimationFrame(moveStep);
        }
        moveStep();
    }

    // 行为序列（页面加载后随机触发）
    window.addEventListener('DOMContentLoaded', () => {
        // 延迟1-3秒开始（模拟用户浏览页面）
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
            const actions = [
                simulateNaturalMouseMove,
                () => {  // 自然滚动（带停顿）
                    const scrollAmount = 100 + Math.random() * 200;
                    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                },
                () => {  // 随机点击可交互元素
                    const clickable = document.querySelectorAll('a, button, [role="button"]');
                    if (clickable.length > 0) {
                        const target = clickable[Math.floor(Math.random() * clickable.length)];
                        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                }
            ];
            // 随机执行1-3个行为（间隔2-4秒）
            const actionCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < actionCount; i++) {
                setTimeout(actions[i % actions.length], i * (2000 + Math.random() * 2000));
            }
        }, delay);
    });

    // 7. 清除脚本痕迹（防Tampermonkey检测）
    safeDefine(window, 'GM_info', undefined);
    safeDefine(window, 'tampermonkey', undefined);
    safeDefine(navigator, '__proto__', Navigator.prototype);  // 锁定原型链

    console.log('Firefox 127 Enhanced Spoofer v6.0 - Active');
})();
