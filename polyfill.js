/**
 * Foliate-js 兼容性补丁 (Polyfills)
 * 解决 Android 旧版 WebView 内核缺失现代 API 的问题
 */

// 1. Object.groupBy (ES2024)
// 报错场景: Foliate epub.js getMetadata 方法
if (typeof Object.groupBy !== 'function') {
    Object.groupBy = function (items, callback) {
        const obj = Object.create(null)
        let i = 0
        for (const item of items) {
            const key = callback(item, i++)
            if (key in obj) {
                obj[key].push(item)
            } else {
                obj[key] = [item]
            }
        }
        return obj
    }
}

// 2. Promise.withResolvers (ES2024)
// 虽然当前没报错，但 Foliate 源码中多处使用了此类异步模式，建议一并预防
if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function () {
        let resolve, reject
        const promise = new Promise((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }
}

// 3. Map.groupBy (ES2024)
if (typeof Map.groupBy !== 'function') {
    Map.groupBy = function (items, callback) {
        const map = new Map()
        let i = 0
        for (const item of items) {
            const key = callback(item, i++)
            const group = map.get(key)
            if (group) {
                group.push(item)
            } else {
                map.set(key, [item])
            }
        }
        return map
    }
}
