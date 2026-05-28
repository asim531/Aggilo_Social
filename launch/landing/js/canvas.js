/* ══════════════════════════ CANVAS NETWORK ANIMATION ══════════════════════════ */
(function () {
    'use strict';

    var canvas = document.getElementById('canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H;

    var COLORS = [
        { r: 56, g: 189, b: 248 }, { r: 45, g: 212, b: 191 }, { r: 244, g: 114, b: 182 },
        { r: 167, g: 139, b: 250 }, { r: 251, g: 146, b: 60 }, { r: 251, g: 191, b: 36 },
        { r: 52, g: 211, b: 153 }, { r: 236, g: 72, b: 153 }
    ];

    // Export COLORS for hero.js
    window._canvasCOLORS = COLORS;

    var nodes = [], trails = [];

    function resize() {
        var dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        initNodes();
    }

    function Node() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2;
        this.r = Math.random() * 2.5 + 1.5;
        this.c = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.energy = Math.random(); this.phase = Math.random() * Math.PI * 2;
    }
    Node.prototype.update = function () {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
        this.x = Math.max(0, Math.min(W, this.x));
        this.y = Math.max(0, Math.min(H, this.y));
        this.energy *= 0.985; this.phase += 0.045;
    };
    Node.prototype.draw = function () {
        var pulse = Math.sin(this.phase) * 0.3 + 0.7;
        var a = 0.55 + this.energy * 0.45;
        var r = this.r * (0.8 + pulse * 0.4);
        var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3.5);
        var c = this.c;
        g.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')');
        g.addColorStop(0.4, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (a * 0.4) + ')');
        g.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; ctx.fill();
    };

    function Trail(x, y, c) { this.x = x; this.y = y; this.life = 55; this.max = 55; this.c = c; }
    Trail.prototype.update = function () { this.life--; return this.life > 0; };
    Trail.prototype.draw = function () {
        var a = (this.life / this.max) * 0.35, r = 2 * (this.life / this.max);
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + this.c.r + ',' + this.c.g + ',' + this.c.b + ',' + a + ')'; ctx.fill();
    };

    function initNodes() {
        nodes = [];
        var count = W < 768 ? 70 : 130;
        for (var i = 0; i < count; i++) nodes.push(new Node());
    }

    var CONN_DIST = 170;
    function drawConns() {
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONN_DIST) {
                    var a = (1 - d / CONN_DIST) * 0.35;
                    var r = Math.floor((nodes[i].c.r + nodes[j].c.r) / 2);
                    var g = Math.floor((nodes[i].c.g + nodes[j].c.g) / 2);
                    var b = Math.floor((nodes[i].c.b + nodes[j].c.b) / 2);
                    ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
                    ctx.lineWidth = 0.8; ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        trails = trails.filter(function (t) { var ok = t.update(); if (ok) t.draw(); return ok; });
        drawConns();
        nodes.forEach(function (n) {
            n.update(); n.draw();
            if (Math.random() > 0.96) trails.push(new Trail(n.x, n.y, n.c));
        });
        requestAnimationFrame(animate);
    }

    // Expose for hero.js pop effects
    window._canvasSpawnNodes = function (x, y, count) {
        for (var i = 0; i < count; i++) {
            var n = new Node(); n.x = x; n.y = y;
            var angle = (Math.PI * 2 * i) / count;
            var speed = 2 + Math.random() * 2.5;
            n.vx = Math.cos(angle) * speed; n.vy = Math.sin(angle) * speed;
            n.energy = 1; nodes.push(n);
        }
    };
    window._canvasAddTrail = function (x, y, c) {
        trails.push(new Trail(x, y, c));
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    /* Mouse attract */
    canvas.addEventListener('mousemove', function (e) {
        nodes.forEach(function (n) {
            var dx = e.clientX - n.x, dy = e.clientY - n.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < 130) {
                var f = (130 - d) / 130 * 0.7;
                n.vx += dx / d * f; n.vy += dy / d * f;
                n.energy = Math.min(1, n.energy + 0.12);
            }
        });
    });

    /* Periodic connection pulses */
    function spawnPulse() {
        var p = document.createElement('div');
        p.className = 'conn-pulse';
        p.style.left = (Math.random() * 80 + 10) + '%';
        p.style.top = (Math.random() * 80 + 10) + '%';
        p.style.position = 'absolute'; p.style.zIndex = '1';
        var hero = document.getElementById('hero');
        if (hero) hero.appendChild(p);
        setTimeout(function () { p.remove(); }, 1800);
    }
    setInterval(spawnPulse, 3200);
    setTimeout(spawnPulse, 1500);
})();
