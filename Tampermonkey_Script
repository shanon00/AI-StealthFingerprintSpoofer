// ==UserScript==
// @name         Stealth Fingerprint Spoofer for CF - Firefox 127 Enhanced
// @namespace    http://tampermonkey.net
// @version      2.8
// @description  伪装浏览器指纹为 Firefox 127，绕过 Cloudflare 和机器人检测，兼容 CSP
// @author       myshell
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Firefox 127 配置
    const spoofedConfig = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        appVersion: '5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        platform: 'Win32',
        language: 'en-US',
        languages: ['en-US', 'en'],
        screenWidth: 1920,
        screenHeight: 1080,
        colorDepth: 24,
        hardwareConcurrency: 8,
        timezoneOffset: -480, // 美国太平洋时间，可改为 +480（中国）
        vendor: '', // Firefox 不暴露
        product: 'Gecko',
        renderer: 'Gecko',
        productSub: '20100101' // Firefox 典型值
    };

    // 伪装 navigator 属性
    Object.defineProperties(navigator, {
        userAgent: { value: spoofedConfig.userAgent, writable: false, configurable: false },
        appVersion: { value: spoofedConfig.appVersion, writable: false, configurable: false },
        platform: { value: spoofedConfig.platform, writable: false, configurable: false },
        language: { value: spoofedConfig.language, writable: false, configurable: false },
        languages: { value: spoofedConfig.languages, writable: false, configurable: false },
        hardwareConcurrency: { value: spoofedConfig.hardwareConcurrency, writable: false, configurable: false },
        webdriver: { value: false, writable: false, configurable: false, enumerable: true }, // 确保可枚举
        vendor: { value: spoofedConfig.vendor, writable: false, configurable: false },
        product: { value: spoofedConfig.product, writable: false, configurable: false },
        appCodeName: { value: 'Mozilla', writable: false, configurable: false },
        appName: { value: 'Netscape', writable: false, configurable: false },
        onLine: { value: true, writable: false, configurable: false },
        vendorSub: { value: '', writable: false, configurable: false },
        productSub: { value: spoofedConfig.productSub, writable: false, configurable: false },
        maxTouchPoints: { value: 0, writable: false, configurable: false },
        doNotTrack: { value: null, writable: false, configurable: false },
        pdfViewerEnabled: { value: true, writable: false, configurable: false },
        // 移除 Chromium 属性
        deviceMemory: { value: undefined, writable: false, configurable: false },
        userAgentData: { value: undefined, writable: false, configurable: false },
        scheduling: { value: undefined, writable: false, configurable: false },
        userActivation: { value: undefined, writable: false, configurable: false },
        connection: { value: undefined, writable: false, configurable: false },
        plugins: { 
            value: [
                { name: 'PDF Viewer', filename: 'pdf-viewer', description: 'Portable Document Format' },
                { name: 'Widevine Content Decryption Module', filename: 'widevinecdm', description: 'DRM' }
            ],
            writable: false, configurable: false 
        },
        mimeTypes: { 
            value: [
                { type: 'application/pdf', suffixes: 'pdf', enabledPlugin: navigator.plugins[0] },
                { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', enabledPlugin: navigator.plugins[0] }
            ],
            writable: false, configurable: false 
        }
    });

    // 伪装屏幕信息
    Object.defineProperties(screen, {
        width: { value: spoofedConfig.screenWidth, writable: false, configurable: false },
        height: { value: spoofedConfig.screenHeight, writable: false, configurable: false },
        availWidth: { value: spoofedConfig.screenWidth, writable: false, configurable: false },
        availHeight: { value: spoofedConfig.screenHeight - 40, writable: false, configurable: false },
        colorDepth: { value: spoofedConfig.colorDepth, writable: false, configurable: false },
        pixelDepth: { value: spoofedConfig.colorDepth, writable: false, configurable: false }
    });

    // 伪装时区
    Date.prototype.getTimezoneOffset = function() {
        return spoofedConfig.timezoneOffset;
    };

    // Canvas 轻微扰动
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, options) {
        const context = originalGetContext.call(this, type, options);
        if (type === '2d' && context) {
            const originalToDataURL = context.canvas.toDataURL;
            context.canvas.toDataURL = function() {
                const imageData = context.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 1500) {
                    imageData.data[i] ^= 1;
                }
                context.putImageData(imageData, 0, 0);
                return originalToDataURL.call(this);
            };
        }
        return context;
    };

    // WebGL 伪装
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 0x9246) return spoofedConfig.vendor; // VENDOR
        if (param === 0x9247) return spoofedConfig.renderer; // RENDERER
        return originalGetParameter.call(this, param);
    };

    // 伪装字体
    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function(text) {
        this.font = '16px Arial, "Helvetica Neue", Helvetica, sans-serif';
        return originalMeasureText.call(this, text);
    };

    // 禁用 WebRTC
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection'].forEach(key => {
        if (window[key]) window[key] = undefined;
    });

    // AudioContext 扰动
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const originalCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function() {
            const osc = originalCreateOscillator.call(this);
            osc.frequency.value += 0.005;
            return osc;
        };
    }

    // 模拟人类行为
    function simulateMouse(x, y) {
        const event = new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y });
        document.body.dispatchEvent(event);
    }
    function simulateScroll() {
        window.scrollBy(0, Math.floor(Math.random() * 100) + 50);
    }
    function simulateClick() {
        const event = new MouseEvent('click', {
            bubbles: true,
            clientX: Math.floor(Math.random() * 500) + 100,
            clientY: Math.floor(Math.random() * 500) + 100
        });
        document.body.dispatchEvent(event);
    }
    setTimeout(() => simulateMouse(500, 500), 4000);
    setTimeout(() => simulateMouse(600, 600), 8000);
    setTimeout(() => simulateScroll(), 6000);
    setTimeout(() => simulateClick(), 10000);

    // 清理痕迹
    if (navigator.storage && 'persistent' in navigator.storage) {
        delete navigator.storage.persistent;
    }
    Object.defineProperty(navigator, '__proto__', {
        value: Navigator.prototype,
        writable: false,
        configurable: false
    });
    Object.defineProperty(window, 'GM_info', {
        value: undefined,
        writable: false,
        configurable: false
    });

    console.log('Stealth spoofing active - Firefox 127 Enhanced v2.8');
})();
