// ==UserScript==
// @name        SFCF
// @description This is your new file, start writing code
// @match       *://*/*
// ==/UserScript==
// ==UserScript==
// @name         Stealth Fingerprint Spoofer for CF - Firefox 127 Enhanced
// @namespace    http://tampermonkey.net
// @version      4.0
// @description  增强版Firefox 127指纹伪装，绕过Cloudflare/反机器人检测，优化行为模拟与指纹一致性
// @author       优化版
// @match        *://*/*
// @grant        none
// @run-at       document-start  // 更早执行，避免初始指纹泄露
// ==/UserScript==
// ==UserScript==
// @name         Stealth Fingerprint Spoofer for CF - Safari 18 Enhanced
// @namespace    http://tampermonkey.net
// @version      5.0
// @description  增强版Safari 18指纹伪装，修复跨平台指纹冲突，优化地理位置一致性
// @author       优化版
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 可配置参数（根据需求调整）
    const config = {
        // 匹配Safari 18的用户代理
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
        platform: 'MacIntel',
        language: 'zh-CN',
        languages: ['zh-CN', 'zh', 'en-US', 'en'],
        screen: {
            width: 1440 + Math.floor(Math.random() * 200),  // 常见macOS分辨率
            height: 900 + Math.floor(Math.random() * 100),
            colorDepth: 24,
            pixelRatio: 2  // 适配Retina屏幕
        },
        hardwareConcurrency: 8 + Math.floor(Math.random() * 4),  // Mac常见CPU核心数
        timezoneOffset: -480,  // 中国时区（UTC+8）
        webdriver: false,
        vendor: 'Apple Inc.',
        product: 'Gecko',
        renderer: 'Apple GPU',
        // 匹配macOS的字体列表
        fonts: [
            'Arial', 'Arial Hebrew', 'Arial Unicode MS', 'Apple Color Emoji',
            'Baskerville', 'Chalkboard SE', 'Cochin', 'Comic Sans MS',
            'Courier New', 'Gill Sans', 'Helvetica Neue', 'Lucida Grande',
            'Marker Felt', 'Menlo', 'Microsoft Sans Serif', 'Monaco',
            'Noteworthy', 'Optima', 'Palatino', 'Snell Roundhand',
            'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
        ]
    };

    // 工具函数：安全重写属性
    const safeDefine = (obj, prop, value) => {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            Object.defineProperty(obj, prop, {
                value, writable: false, configurable: false, enumerable: true
            });
        }
    };

    // 1. 修复用户代理与平台一致性
    const fakeNavigator = {
        userAgent: config.userAgent,
        appVersion: config.userAgent,
        platform: config.platform,
        language: config.language,
        languages: config.languages,
        hardwareConcurrency: config.hardwareConcurrency,
        webdriver: config.webdriver,
        vendor: config.vendor,
        product: config.product,
        appCodeName: 'Mozilla',
        appName: 'Netscape',
        onLine: true,
        vendorSub: '',
        productSub: '20100101',
        maxTouchPoints: 0,
        doNotTrack: null,
        pdfViewerEnabled: true,
        deviceMemory: 16,  // 匹配macOS常见内存
        userAgentData: undefined,
        // Safari特有属性
        safari: { pushNotification: { toString: () => '[object SafariRemoteNotification]' } },
        webkitTemporaryStorage: { queryUsageAndQuota: () => Promise.resolve() },
        webkitPersistentStorage: { queryUsageAndQuota: () => Promise.resolve() },
        // 插件列表（macOS Safari默认）
        plugins: Object.freeze([
            Object.freeze({
                name: 'QuickTime Plugin',
                filename: 'libnpqtplugin.dylib',
                description: 'QuickTime Plugin 7.7.9',
                length: 0
            }),
            Object.freeze({
                name: 'Shockwave Flash',
                filename: 'FlashPlayer.plugin',
                description: 'Shockwave Flash 32.0 r0',
                length: 0
            }),
            Object.freeze({
                name: 'Adobe Acrobat',
                filename: 'AdobePDFViewer.plugin',
                description: 'Adobe Acrobat Plug-in 2025.001.20135',
                length: 0
            })
        ]),
        // MIME类型
        mimeTypes: Object.freeze([
            Object.freeze({ type: 'application/pdf', suffixes: 'pdf', enabledPlugin: navigator.plugins[2] }),
            Object.freeze({ type: 'application/x-shockwave-flash', suffixes: 'swf', enabledPlugin: navigator.plugins[1] }),
            Object.freeze({ type: 'video/quicktime', suffixes: 'mov,qt', enabledPlugin: navigator.plugins[0] })
        ])
    };

    // 覆盖navigator属性
    Object.keys(fakeNavigator).forEach(prop => {
        safeDefine(navigator, prop, fakeNavigator[prop]);
    });

    // 2. 屏幕信息与macOS匹配
    safeDefine(screen, 'width', config.screen.width);
    safeDefine(screen, 'height', config.screen.height);
    safeDefine(screen, 'availWidth', config.screen.width);
    safeDefine(screen, 'availHeight', config.screen.height - 22);  // macOS菜单栏高度
    safeDefine(screen, 'colorDepth', config.screen.colorDepth);
    safeDefine(screen, 'pixelDepth', config.screen.colorDepth);
    safeDefine(window, 'devicePixelRatio', config.screen.pixelRatio);

    // 3. 时区与地理位置一致性（结合IP位置）
    const originalDate = Date;
    Date = function(...args) {
        const date = new originalDate(...args);
        date.getTimezoneOffset = () => config.timezoneOffset;
        return date;
    };
    Date.prototype = originalDate.prototype;
    Date.now = originalDate.now;
    Date.parse = originalDate.parse;

    // 4. 增强Canvas指纹伪装
    const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, options) {
        const context = originalCanvasGetContext.call(this, type, options);
        if (type === '2d' && context) {
            // 存储原始方法
            const originalFillText = context.fillText;
            const originalStrokeText = context.strokeText;
            const originalDrawImage = context.drawImage;
            
            // 修改文本渲染
            context.fillText = function(text, x, y, maxWidth) {
                // 轻微调整文本位置（模拟字体渲染差异）
                const offsetX = Math.random() * 0.5 - 0.25;
                const offsetY = Math.random() * 0.5 - 0.25;
                return originalFillText.call(this, text, x + offsetX, y + offsetY, maxWidth);
            };
            
            context.strokeText = function(text, x, y, maxWidth) {
                const offsetX = Math.random() * 0.5 - 0.25;
                const offsetY = Math.random() * 0.5 - 0.25;
                return originalStrokeText.call(this, text, x + offsetX, y + offsetY, maxWidth);
            };
            
            // 修改图像渲染
            context.drawImage = function(image, ...args) {
                // 添加微小的透明度变化
                const originalGlobalAlpha = this.globalAlpha;
                this.globalAlpha = originalGlobalAlpha * (0.995 + Math.random() * 0.01);
                const result = originalDrawImage.call(this, image, ...args);
                this.globalAlpha = originalGlobalAlpha;
                return result;
            };
            
            // 干扰toDataURL
            context.canvas.toDataURL = function() {
                const original = this._toDataURL || this.toDataURL;
                const data = original.apply(this, arguments);
                // 随机替换几个字符（不影响显示但改变哈希）
                if (data.length > 100) {
                    const arr = data.split('');
                    for (let i = 0; i < 5; i++) {
                        const pos = 50 + Math.floor(Math.random() * (data.length - 100));
                        arr[pos] = String.fromCharCode(arr[pos].charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
                    }
                    return arr.join('');
                }
                return data;
            };
            // 保存原始方法用于后续调用
            if (!context.canvas._toDataURL) {
                context.canvas._toDataURL = context.canvas.toDataURL;
            }
        }
        return context;
    };

    // 5. 完善WebGL伪装（匹配Safari）
    if (window.WebGLRenderingContext) {
        const originalWebGLGetParam = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(param) {
            const params = {
                0x9246: config.vendor,  // VENDOR
                0x9247: config.renderer,  // RENDERER
                0x1F00: 'WebGL 2.0',  // Safari支持WebGL 2.0
                0x1F01: 'OpenGL ES GLSL ES 3.00',
                0x930B: 'WebKit',  // UNMASKED_VENDOR_WEBGL
                0x930C: 'Apple GPU'  // UNMASKED_RENDERER_WEBGL
            };
            return params[param] || originalWebGLGetParam.call(this, param);
        };
        
        // 添加Safari特有的WebGL扩展
        const originalGetSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
        WebGLRenderingContext.prototype.getSupportedExtensions = function() {
            const extensions = originalGetSupportedExtensions.call(this) || [];
            // 添加Safari特有的扩展
            return [...extensions, 
                'WEBGL_compressed_texture_astc', 
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders'
            ];
        };
    }

    // 6. 字体指纹伪装（macOS Safari字体列表）
    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function(text) {
        // 随机选择一种macOS字体
        const font = config.fonts[Math.floor(Math.random() * config.fonts.length)];
        this.font = `${14 + Math.floor(Math.random() * 4)}px ${font}`;
        return originalMeasureText.call(this, text);
    };

    // 7. 彻底禁用WebRTC
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(key => {
        safeDefine(window, key, undefined);
    });

    // 8. 音频指纹伪装
    if (window.AudioContext) {
        const originalAudioContext = window.AudioContext;
        window.AudioContext = function(...args) {
            const ctx = new originalAudioContext(...args);
            // 调整采样率（macOS常见值）
            ctx.sampleRate = 44100;
            return ctx;
        };
        window.AudioContext.prototype = originalAudioContext.prototype;
    }

    // 9. 地理位置一致性（模拟新加坡访问）
    if (navigator.geolocation) {
        const originalGetLocation = navigator.geolocation.getCurrentPosition;
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
            // 模拟新加坡位置（1.2897,103.8501）附近的随机点
            const position = {
                coords: {
                    latitude: 1.2897 + (Math.random() * 0.01 - 0.005),
                    longitude: 103.8501 + (Math.random() * 0.01 - 0.005),
                    accuracy: 100 + Math.random() * 200,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                },
                timestamp: Date.now()
            };
            // 延迟返回（模拟网络请求）
            setTimeout(() => success(position), 500 + Math.random() * 500);
            return {
                cancel: () => {}
            };
        };
    }

    // 10. 模拟macOS特有行为
    const simulateMacBehavior = () => {
        // 模拟Command键使用（macOS特有）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Meta') {  // Command键
                // 随机触发一些macOS常见快捷键行为
                setTimeout(() => {
                    const actions = [
                        () => document.execCommand('copy'),
                        () => document.execCommand('paste'),
                        () => document.execCommand('selectAll'),
                        () => {
                            const focusable = document.querySelector('input, textarea, [contenteditable]');
                            if (focusable) focusable.focus();
                        }
                    ];
                    actions[Math.floor(Math.random() * actions.length)]();
                }, 100 + Math.random() * 200);
            }
        });
    };

    // 11. 行为模拟
    window.addEventListener('DOMContentLoaded', () => {
        // 延迟开始（模拟用户阅读）
        const delay = 1500 + Math.random() * 4000;
        setTimeout(() => {
            // 执行macOS特有行为模拟
            simulateMacBehavior();
            
            // 随机执行一系列用户行为
            const actions = [
                // 模拟macOS风格的滚动（平滑但有弹性）
                () => {
                    const scrollY = window.scrollY;
                    const targetY = scrollY + (Math.random() > 0.5 ? 200 : -200);
                    window.scrollTo({
                        top: Math.max(0, Math.min(document.body.scrollHeight - window.innerHeight, targetY)),
                        behavior: 'smooth'
                    });
                },
                // 模拟点击
                () => {
                    const clickable = document.querySelectorAll('button, a, [role="button"]');
                    if (clickable.length > 0) {
                        const target = clickable[Math.floor(Math.random() * clickable.length)];
                        const rect = target.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        
                        // 先移动到目标元素
                        simulateNaturalMouseMove(window.lastMouseX || x, window.lastMouseY || y, x, y);
                        
                        // 延迟点击
                        setTimeout(() => {
                            target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
                            setTimeout(() => {
                                target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
                                target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
                            }, 50 + Math.random() * 100);
                        }, 800 + Math.random() * 500);
                    }
                },
                // 模拟macOS特有的捏合手势（在触摸板上）
                () => {
                    const event = new WheelEvent('wheel', {
                        bubbles: true,
                        clientX: window.innerWidth / 2,
                        clientY: window.innerHeight / 2,
                        deltaX: 0,
                        deltaY: 0,
                        deltaZ: Math.random() > 0.5 ? 100 : -100,  // 缩放方向
                        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
                        metaKey: true  // Command键按下（macOS缩放）
                    });
                    document.dispatchEvent(event);
                }
            ];
            
            // 随机执行2-4个行为
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                setTimeout(actions[i % actions.length], i * (3000 + Math.random() * 4000));
            }
        }, delay);
    });

    // 12. 隐藏脚本痕迹
    safeDefine(window, 'GM_info', undefined);
    safeDefine(window, 'tampermonkey', undefined);
    safeDefine(navigator, '__proto__', Navigator.prototype);

    console.log('Stealth Spoofer Enhanced v5.0 - Safari 18 (macOS) Mode');
})();
