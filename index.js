function lerp(a, b, t) {
    return a*(1 - t) + b*t;
}

class Gradient {
    constructor(options) {
        this.colors = [];

        const colors = options.colorStops;
        const segmentSize = options.segmentSize;

        for (let i = 0; i < colors.length; ++i) {
            const c0 = colors[i];
            const c1 = colors[(i + 1) % colors.length];

            for (let j = 0; j < segmentSize; ++j) {
                const t = j/segmentSize;

                const r = lerp(c0.r, c1.r, t);
                const g = lerp(c0.g, c1.g, t);
                const b = lerp(c0.b, c1.b, t);

                this.colors.push({r: r|0, g: g|0, b: b|0});
            }
        }

        this.size = this.colors.length;
    }
}

class Point {
    constructor(x, y, colorIdx = 0) {
        this.x = x;
        this.y = y;
        this.colorIdx = colorIdx;
    }
}

class Trail {
    constructor(options) {
        this.ctx = options.context;
        this.grd = options.gradient;
        this.maxLength = options.maxLength;
        this.minWidth = options.minWidth;
        this.maxWidth = options.maxWidth;

        this.points = new Array(options.maxLength);
        this.head = 0;
        this.tail = 0;
        this.length = 0;
        ctx.canvas.addEventListener("mousemove", this.onMouseMove);

        this.width = options.minWidth;
        this.isGrowing = true;

        this.requestId = 0;
        this.startAnimation();
    }

    startAnimation() {
        this.start = performance.now();
        this.requestId = requestAnimationFrame(this.draw);
    }

    stopAnimation() {
        cancelAnimationFrame(this.requestId);
    }

    addPoint(p) {
        this.points[this.head] = p;
        this.head = (this.head + 1) % this.maxLength;

        if (this.length === this.maxLength) {
            this.tail = this.head;
        } else {
            ++this.length;
        }
    }

    removePoint() {
        delete this.points[this.tail];
        this.tail = (this.tail + 1) % this.maxLength;

        --this.length;
    }

    draw = (now) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const dt = now - this.start;

        if (dt > 30 && this.length) {
            this.removePoint();
            this.start = now;
        }


        if (this.isGrowing) {
            this.width += (this.maxWidth - this.minWidth)*0.016;

            if (this.width >= this.maxWidth) {
                this.isGrowing = false;
            }
        } else {
            this.width -= (this.maxWidth - this.minWidth)*0.016;

            if (this.width <= this.minWidth) {
                this.isGrowing = true;
            }
        }


        for (let i = 0; i < this.maxLength; ++i) {
            const pi = this.points[(this.head + i) % this.maxLength];

            if (!pi) {
                continue;
            }

            const ci = grd.colors[pi.colorIdx];

            ctx.fillStyle = `rgb(${ci.r}, ${ci.g}, ${ci.b})`;
            ctx.beginPath();
            ctx.arc(pi.x, pi.y, this.width/2, 0, 2*Math.PI);
            ctx.fill();

            pi.colorIdx = (pi.colorIdx + 7) % this.grd.size;
        }

        this.requestId = requestAnimationFrame(this.draw);
    }

    onMouseMove = ({clientX: x, clientY: y}) => {
        const p0 = this.points[(this.head - 1 + this.points.length) % this.points.length];
        const p1 = new Point(x, y);

        if (!p0) {
            this.addPoint(p1);
            return;
        }

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const d = Math.hypot(dx, dy);

        let tmp = p0.colorIdx;

        for (let i = 10; i < d; i += 10) {
            const t = i/d;
            const xi = lerp(p0.x, p1.x, t);
            const yi = lerp(p0.y, p1.y, t);

            tmp = (tmp + 1) % this.grd.size;
            this.addPoint(new Point(xi, yi, tmp));
        }
    }
}
