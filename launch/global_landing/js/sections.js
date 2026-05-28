/* ══════════════════════════ SECTION ANIMATIONS & SCROLL REVEALS ══════════════════════════ */
(function () {
    'use strict';

    /* ═══════════════════ CLIO ZOOM CASCADE ═══════════════════ */
    (function () {
        var czSection = document.getElementById('clioZoom');
        if (!czSection) return;

        var czLevels = czSection.querySelectorAll('.cz-level');
        var czConns = czSection.querySelectorAll('.cz-connector');
        var czScan = document.getElementById('czScan');
        var czBadges = document.getElementById('czBadges');
        var czObserved = false;

        function runCzAnimation() {
            if (czObserved) return;
            czObserved = true;

            if (czScan) setTimeout(function () { czScan.classList.add('cz-revealed'); }, 80);

            czLevels.forEach(function (level, i) {
                var delay = 150 + i * 240;
                setTimeout(function () { level.classList.add('cz-revealed'); }, delay);
                if (czConns[i]) {
                    setTimeout(function () { czConns[i].classList.add('cz-revealed'); }, delay + 180);
                }
            });

            if (czBadges) setTimeout(function () { czBadges.classList.add('cz-revealed'); }, 150 + czLevels.length * 240 + 200);

            /* Room cluster mini-nodes */
            initRoomCluster();
        }

        var czObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { runCzAnimation(); czObs.disconnect(); }
        }, { threshold: 0.22 });
        czObs.observe(czSection);
    }());

    /* ═══════════════════ ROOM MINI-CLUSTER ═══════════════════ */
    function initRoomCluster() {
        var container = document.querySelector('.cz-room-cluster');
        if (!container || container.dataset.init) return;
        container.dataset.init = 'true';

        var clusterColors = [
            'rgba(56, 189, 248, 0.8)',
            'rgba(45, 212, 191, 0.85)',
            'rgba(244, 114, 182, 0.75)',
            'rgba(167, 139, 250, 0.8)',
            'rgba(251, 146, 60, 0.75)',
            'rgba(52, 211, 153, 0.8)'
        ];

        // Create 6 small nodes in a cluster layout
        var positions = [
            { x: 10, y: 8 }, { x: 28, y: 4 }, { x: 44, y: 12 },
            { x: 18, y: 22 }, { x: 36, y: 24 }, { x: 50, y: 20 }
        ];

        var nodeEls = [];
        positions.forEach(function (pos, i) {
            var node = document.createElement('div');
            node.className = 'cz-room-node';
            var size = 4 + Math.random() * 3;
            node.style.width = size + 'px';
            node.style.height = size + 'px';
            node.style.left = pos.x + 'px';
            node.style.top = pos.y + 'px';
            node.style.background = clusterColors[i];
            node.style.color = clusterColors[i];
            node.style.animationDelay = (i * 0.4) + 's';
            container.appendChild(node);
            nodeEls.push({ el: node, x: pos.x + size / 2, y: pos.y + size / 2 });
        });

        // Draw connection lines using a DPR-aware canvas (crisp on retina)
        var dpr = window.devicePixelRatio || 1;
        var cvs = document.createElement('canvas');
        var W = 60, H = 32;
        cvs.width  = W * dpr;
        cvs.height = H * dpr;
        cvs.style.cssText = 'position:absolute;top:0;left:0;width:' + W + 'px;height:' + H + 'px;pointer-events:none;';
        container.appendChild(cvs);
        var cctx = cvs.getContext('2d');
        cctx.scale(dpr, dpr);

        function drawLines() {
            cctx.clearRect(0, 0, 60, 32);
            for (var i = 0; i < nodeEls.length; i++) {
                for (var j = i + 1; j < nodeEls.length; j++) {
                    var dx = nodeEls[j].x - nodeEls[i].x;
                    var dy = nodeEls[j].y - nodeEls[i].y;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 25) {
                        var alpha = (1 - d / 25) * 0.3;
                        cctx.beginPath();
                        cctx.moveTo(nodeEls[i].x, nodeEls[i].y);
                        cctx.lineTo(nodeEls[j].x, nodeEls[j].y);
                        cctx.strokeStyle = 'rgba(45, 212, 191, ' + alpha + ')';
                        cctx.lineWidth = 0.5;
                        cctx.stroke();
                    }
                }
            }
        }
        drawLines();
    }

    /* ═══════════════════ SCROLL REVEAL ═══════════════════ */
    var revealEls = document.querySelectorAll('.problem-block, .problem-transition');
    var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });
    revealEls.forEach(function (el) { revealObs.observe(el); });

    /* Hero auto-close */
    var heroSection = document.querySelector('.hero');
    var intCard = document.getElementById('interactionCard');
    var sessionBar = document.getElementById('clioSessionBar');
    if (heroSection) {
        var heroObs = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            if (!entry.isIntersecting) {
                if (intCard && intCard.classList.contains('active')) {
                    intCard.classList.remove('active', 'mode-modal', 'mode-explore');
                    var bd = document.querySelector('.clio-backdrop');
                    if (bd) bd.classList.remove('active');
                    if (window._showHeroAvatar) window._showHeroAvatar();
                }
                if (sessionBar) sessionBar.classList.remove('visible');
            }
        }, { threshold: 0.05 });
        heroObs.observe(heroSection);
    }

    /* Scenario cards staggered reveal */
    var scCards = document.querySelectorAll('.sc-card');
    var scObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var delay = Array.from(scCards).indexOf(entry.target) * 80;
                setTimeout(function () { entry.target.classList.add('visible'); }, delay);
                scObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    scCards.forEach(function (c) { scObs.observe(c); });

    /* Make Your Crowd cards staggered reveal */
    var bycCards = document.querySelectorAll('.byc-card');
    if (bycCards.length) {
        var bycObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var delay = Array.from(bycCards).indexOf(entry.target) * 120;
                    setTimeout(function () { entry.target.classList.add('visible'); }, delay);
                    bycObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        bycCards.forEach(function (c) { bycObs.observe(c); });
    }

    /* ═══════════════════ SOCIAL PROOF COUNTER ═══════════════════ */
    (function () {
        var counterEl = document.getElementById('spCounterNum');
        var spSection = document.getElementById('socialProof');
        if (!counterEl || !spSection) return;

        /* Target count — update this as real signups grow */
        var TARGET = 847;
        var DURATION = 1800; /* ms */

        function animateCount() {
            var start = null;
            function step(ts) {
                if (!start) start = ts;
                var progress = Math.min((ts - start) / DURATION, 1);
                /* Ease-out cubic */
                var eased = 1 - Math.pow(1 - progress, 3);
                var val = Math.round(eased * TARGET);
                counterEl.textContent = val.toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        var spObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                animateCount();
                spObs.disconnect();
            }
        }, { threshold: 0.3 });
        spObs.observe(spSection);
    }());

    /* ═══════════════════ DATA-CLIO CLICK TRIGGERS ═══════════════════
       FAQ items and How-It-Works steps open Clio's contextual card.
       _openContextCard is defined in interaction-card.js (loads first).
    */
    (function () {
        /* FAQ questions */
        document.querySelectorAll('.faq-item[data-clio] .faq-q').forEach(function (q) {
            q.addEventListener('click', function (e) {
                var ctx = q.parentElement.dataset.clio;
                if (ctx && window._openContextCard) {
                    window._openContextCard(ctx, e.clientX, e.clientY);
                }
            });
        });
        /* Step cards */
        document.querySelectorAll('.step[data-clio]').forEach(function (step) {
            step.style.cursor = 'pointer';
            step.addEventListener('click', function (e) {
                var ctx = step.dataset.clio;
                if (ctx && window._openContextCard) {
                    window._openContextCard(ctx, e.clientX, e.clientY);
                }
            });
        });
    }());
})();
