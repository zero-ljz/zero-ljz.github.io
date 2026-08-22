/** Tailwind 构建配置：与页面使用的自定义主题保持一致（原 CDN 内联配置的静态版本）。 */
module.exports = {
    content: ['./index.html'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'PingFang SC', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
            },
            colors: {
                brand: {
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14B8A6',
                    600: '#0d9488'
                },
                glass: {
                    bg: 'rgba(30, 41, 59, 0.90)',
                    border: 'rgba(255, 255, 255, 0.08)',
                    hover: 'rgba(255, 255, 255, 0.08)'
                }
            },
            zIndex: {
                'menu': '9999'
            }
        }
    },
    plugins: []
};
