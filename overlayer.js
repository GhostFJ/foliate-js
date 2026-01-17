const createSVGElement = tag =>
    document.createElementNS('http://www.w3.org/2000/svg', tag)

export class Overlayer {
    #svg = createSVGElement('svg')
    #map = new Map()
    constructor() {
        Object.assign(this.#svg.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: '10',
        })
    }
    get element() {
        return this.#svg
    }
    add(key, range, draw, options) {
        if (this.#map.has(key)) this.remove(key)
        if (typeof range === 'function') range = range(this.#svg.getRootNode())
        const rects = range.getClientRects()
        const element = draw(rects, options)
        this.#svg.append(element)
        this.#map.set(key, { range, draw, options, element, rects })
    }
    remove(key) {
        if (!this.#map.has(key)) return
        this.#svg.removeChild(this.#map.get(key).element)
        this.#map.delete(key)
    }
    redraw() {
        for (const obj of this.#map.values()) {
            const { range, draw, options, element } = obj
            this.#svg.removeChild(element)
            const rects = range.getClientRects()
            const el = draw(rects, options)
            this.#svg.append(el)
            obj.element = el
            obj.rects = rects
        }
    }
    hitTest({ clientX: x, clientY: y }) {
        const tolerance = 10
        const svgRect = this.#svg.getBoundingClientRect()
        const zoom = svgRect.width / this.#svg.clientWidth || 1

        // 转换为 SVG 内部坐标
        x = (x - svgRect.left) / zoom
        y = (y - svgRect.top) / zoom

        const arr = Array.from(this.#map.entries())
        for (let i = arr.length - 1; i >= 0; i--) {
            const [key, obj] = arr[i]
            for (const rect of obj.rects) {
                const { left, top, right, bottom } = rect
                if (x >= left - tolerance && x <= right + tolerance && y >= top - tolerance && y <= bottom + tolerance)
                    return [key, obj.range, rect]
            }
        }
        return []
    }
    static #applyAttributes(element, attributes) {
        if (!attributes) return
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'style' && typeof value === 'string') {
                element.style.cssText += ';' + value
            } else {
                element.setAttribute(key, value)
            }
        }
        if (attributes['data-annotation-id']) {
            element.setAttribute('pointer-events', 'all')
            element.setAttribute('cursor', 'pointer')
            element.style.pointerEvents = 'all'
            element.style.cursor = 'pointer'
        }
    }
    static underline(rects, options = {}) {
        const { color = 'red', width: strokeWidth = 2, writingMode, attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', color)
        Overlayer.#applyAttributes(g, attributes)
        for (const rect of rects) {
            const { left, top, width, height, right, bottom } = rect
            // Add a transparent rect to make the whole area clickable
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            if (writingMode === 'vertical-rl' || writingMode === 'vertical-lr') {
                const el = createSVGElement('rect')
                el.setAttribute('x', right - strokeWidth)
                el.setAttribute('y', top)
                el.setAttribute('height', height)
                el.setAttribute('width', strokeWidth)
                g.append(el)
            } else {
                const el = createSVGElement('rect')
                el.setAttribute('x', left)
                el.setAttribute('y', bottom - strokeWidth)
                el.setAttribute('height', strokeWidth)
                el.setAttribute('width', width)
                g.append(el)
            }
        }
        return g
    }
    static strikethrough(rects, options = {}) {
        const { color = 'red', width: strokeWidth = 2, writingMode, attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', color)
        Overlayer.#applyAttributes(g, attributes)
        for (const rect of rects) {
            const { left, top, width, height, right, bottom } = rect
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            if (writingMode === 'vertical-rl' || writingMode === 'vertical-lr') {
                const el = createSVGElement('rect')
                el.setAttribute('x', (right + left) / 2)
                el.setAttribute('y', top)
                el.setAttribute('height', height)
                el.setAttribute('width', strokeWidth)
                g.append(el)
            } else {
                const el = createSVGElement('rect')
                el.setAttribute('x', left)
                el.setAttribute('y', (top + bottom) / 2)
                el.setAttribute('height', strokeWidth)
                el.setAttribute('width', width)
                g.append(el)
            }
        }
        return g
    }
    static squiggly(rects, options = {}) {
        const { color = 'red', width: strokeWidth = 2, writingMode, attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', 'none')
        g.setAttribute('stroke', color)
        g.setAttribute('stroke-width', strokeWidth)
        Overlayer.#applyAttributes(g, attributes)
        const block = strokeWidth * 1.5
        for (const rect of rects) {
            const { left, top, width, height, right, bottom } = rect
            // Add a transparent rect to make the whole area clickable
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            if (writingMode === 'vertical-rl' || writingMode === 'vertical-lr') {
                const el = createSVGElement('path')
                const n = Math.round(height / block / 1.5)
                const inline = height / n
                const ls = Array.from({ length: n },
                    (_, i) => `l${i % 2 ? -block : block} ${inline}`).join('')
                el.setAttribute('d', `M${right} ${top}${ls}`)
                g.append(el)
            } else {
                const el = createSVGElement('path')
                const n = Math.round(width / block / 1.5)
                const inline = width / n
                const ls = Array.from({ length: n },
                    (_, i) => `l${inline} ${i % 2 ? block : -block}`).join('')
                el.setAttribute('d', `M${left} ${bottom}${ls}`)
                g.append(el)
            }
        }
        return g
    }
    static dashed(rects, options = {}) {
        const { color = 'currentColor', width: strokeWidth = 2, writingMode, attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', 'none')
        g.setAttribute('stroke', color)
        g.setAttribute('stroke-width', strokeWidth)
        g.setAttribute('stroke-dasharray', `${strokeWidth * 3},${strokeWidth * 2}`)
        Overlayer.#applyAttributes(g, attributes)
        for (const rect of rects) {
            const { left, top, width, height, right, bottom } = rect
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            const el = createSVGElement('line')
            if (writingMode === 'vertical-rl' || writingMode === 'vertical-lr') {
                el.setAttribute('x1', right - strokeWidth)
                el.setAttribute('y1', top)
                el.setAttribute('x2', right - strokeWidth)
                el.setAttribute('y2', bottom)
            } else {
                el.setAttribute('x1', left)
                el.setAttribute('y1', bottom - strokeWidth)
                el.setAttribute('x2', right)
                el.setAttribute('y2', bottom - strokeWidth)
            }
            g.append(el)
        }
        return g
    }
    static highlight(rects, options = {}) {
        const { color = 'red', attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', color)
        g.style.opacity = 'var(--overlayer-highlight-opacity, .3)'
        g.style.mixBlendMode = 'var(--overlayer-highlight-blend-mode, normal)'
        Overlayer.#applyAttributes(g, attributes)
        for (const { left, top, height, width } of rects) {
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            const el = createSVGElement('rect')
            el.setAttribute('x', left)
            el.setAttribute('y', top)
            el.setAttribute('height', height)
            el.setAttribute('width', width)
            g.append(el)
        }
        return g
    }
    static outline(rects, options = {}) {
        const { color = 'red', width: strokeWidth = 3, radius = 3, attributes } = options
        const g = createSVGElement('g')
        g.setAttribute('fill', 'none')
        g.setAttribute('stroke', color)
        g.setAttribute('stroke-width', strokeWidth)
        Overlayer.#applyAttributes(g, attributes)
        for (const rect of rects) {
            const { left, top, height, width } = rect
            const hitRect = createSVGElement('rect')
            hitRect.setAttribute('x', left)
            hitRect.setAttribute('y', top)
            hitRect.setAttribute('width', width)
            hitRect.setAttribute('height', height)
            hitRect.setAttribute('fill', 'white')
            hitRect.setAttribute('fill-opacity', '0')
            hitRect.setAttribute('pointer-events', 'all')
            hitRect.setAttribute('cursor', 'pointer')
            hitRect.setAttribute('stroke', 'none')
            if (attributes?.['data-annotation-id']) {
                hitRect.setAttribute('data-annotation-id', attributes['data-annotation-id'])
            }
            g.append(hitRect)

            const el = createSVGElement('rect')
            el.setAttribute('x', left)
            el.setAttribute('y', top)
            el.setAttribute('height', height)
            el.setAttribute('width', width)
            el.setAttribute('rx', radius)
            g.append(el)
        }
        return g
    }
    // make an exact copy of an image in the overlay
    // one can then apply filters to the entire element, without affecting them;
    // it's a bit silly and probably better to just invert images twice
    // (though the color will be off in that case if you do heu-rotate)
    static copyImage([rect], options = {}) {
        const { src } = options
        const image = createSVGElement('image')
        const { left, top, height, width } = rect
        image.setAttribute('href', src)
        image.setAttribute('x', left)
        image.setAttribute('y', top)
        image.setAttribute('height', height)
        image.setAttribute('width', width)
        return image
    }
}

