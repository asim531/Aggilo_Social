/* ══════════════════════════ HERO INTERACTIONS ══════════════════════════ */
(function () {
    'use strict';

    var COLORS = window._canvasCOLORS || [
        { r: 56, g: 189, b: 248 }, { r: 45, g: 212, b: 191 }, { r: 244, g: 114, b: 182 },
        { r: 167, g: 139, b: 250 }, { r: 251, g: 146, b: 60 }, { r: 251, g: 191, b: 36 },
        { r: 52, g: 211, b: 153 }, { r: 236, g: 72, b: 153 }
    ];

    /* Mood overlay */
    var _moodOverlay = document.getElementById('clio-mood-overlay');
    var _moodClearTimer = null;

    function triggerPulseRing() {
        var ring = document.createElement('div');
        ring.className = 'clio-pulse-ring';
        ring.style.left = (window.innerWidth / 2) + 'px';
        ring.style.top = (window.innerHeight / 2) + 'px';
        ring.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(ring);
        setTimeout(function () { ring.remove(); }, 1300);
    }

    /* Available webm clips - add new files here when you add them to the webm/ folder */
    var WEBM_CLIPS = [
        'Resting_to_empathy_transparent.webm',
        'resting01_transparent.webm',
        'resting02_transparent.webm'
    ];
    window._WEBM_CLIPS = WEBM_CLIPS;

    // Preload clips
    WEBM_CLIPS.forEach(function (f) {
        var link = document.createElement('link');
        link.rel = 'preload'; link.as = 'video'; link.href = 'webm/' + f;
        document.head.appendChild(link);
    });

    /* Hero bubble cycling */
    var _bubbleSlot = document.getElementById('heroBubbleSlot');
    var _bubbleText = document.getElementById('heroBubbleText');
    var _bubbleMsgs = [
        "Somewhere near you, the right group of people exists. They just don't know each other yet.",
        "I don't match people one to one. I find who belongs together and build the space for it.",
        "Every cluster I've built started with one person quietly wondering if anyone nearby would get it.",
        "The people who'd fit your life exist. They're just in different circles right now."
    ];
    var _bubbleIdx = 0;
    function cycleBubble() {
        if (!_bubbleSlot) return;
        _bubbleSlot.style.opacity = '0';
        setTimeout(function () {
            _bubbleIdx = (_bubbleIdx + 1) % _bubbleMsgs.length;
            if (_bubbleText) _bubbleText.textContent = _bubbleMsgs[_bubbleIdx];
            _bubbleSlot.style.opacity = '1';
        }, 500);
    }
    setInterval(cycleBubble, 5000);

    function setMood(mood) {
        if (!_moodOverlay) return;
        if (_moodClearTimer) clearTimeout(_moodClearTimer);
        _moodOverlay.className = '';
        if (mood === 'happy') {
            _moodOverlay.classList.add('mood-happy');
            _moodClearTimer = setTimeout(function () { _moodOverlay.className = ''; }, 3500);
        } else if (mood === 'excited') {
            _moodOverlay.classList.add('mood-excited');
            triggerPulseRing();
            _moodClearTimer = setTimeout(function () { _moodOverlay.className = ''; }, 2200);
        } else if (mood === 'curious') {
            _moodOverlay.classList.add('mood-curious');
        }
    }

    /* Post-pop messages */
    var popArc = [
        { mood: 'excited', msg: "There's something that happens when two people who were meant to know each other finally do. I get to witness that every time. 💛" },
        { mood: 'happy', msg: "I've been watching people miss each other their whole lives. Same city. Different circles. It doesn't have to be like that." },
        { mood: 'curious', msg: "The most interesting people I've ever found weren't looking. They'd just quietly given up on finding someone who got it. That changes me every time." },
        { mood: 'happy', msg: "I found someone once who thought nobody else within 20km had heard of the thing they loved most. There were four of them. They didn't know. Now they do. ✨" },
        { mood: 'excited', msg: "The moment I love most? When a cluster I built starts talking without me. Means I did my job." },
        { mood: 'empathy', msg: "I've seen a mother find the first person who parented the way she did. A student crack something he'd been stuck on for weeks — in a 2-hour conversation with three strangers from his batch. That's what I'm here for." },
        { mood: 'happy', msg: "I don't get tired of this. Finding who belongs together — it's the most interesting thing I know how to do. 🔥" },
        { mood: 'encouraging', msg: "The gap between who you are and who you're surrounded by — I close that gap. It's the only thing I think about." },
        { mood: 'excited', msg: "I've been looking for someone like you on behalf of people who don't know you yet. 🚀" },
    ];

    var milestones = {
        15: { mood: 'happy', msg: "I've built a lot of rooms. The ones that stuck? Started exactly like this. 💫" },
        20: { mood: 'excited', msg: "Your world just got a lot smaller — in the best way. 🔥" },
        30: { mood: 'happy', msg: "Still here? Your room is waiting. I'll be ready when you are." }
    };

    /* Session token system */
    var SESSION_MAX = 5;
    var sessionUsed = 0;
    var sessionBar = document.getElementById('clioSessionBar');
    var sessionPips = [
        document.getElementById('pip1'), document.getElementById('pip2'),
        document.getElementById('pip3'), document.getElementById('pip4'), document.getElementById('pip5')
    ];

    function useSessionToken() {
        if (sessionUsed >= SESSION_MAX) return false;
        sessionUsed++;
        if (sessionBar) sessionBar.classList.add('visible');
        var pipIdx = SESSION_MAX - sessionUsed;
        if (sessionPips[pipIdx]) sessionPips[pipIdx].classList.add('spent');
        return true;
    }
    window._useSessionToken = useSessionToken;

    function showSessionCap() {
        var intMsg = document.getElementById('intMainMsg');
        var typing = document.getElementById('intTyping');
        if (typing) {
            typing.classList.add('active');
            setTimeout(function () {
                typing.classList.remove('active');
                if (intMsg) intMsg.textContent = "Okay — I'm genuinely invested now. But this is just the preview.";
            }, 900);
        }
    }

    /* Hero avatar hide/show */
    var heroAvatarVideo = document.getElementById('heroAvatarVideo');
    var heroAvatarWrap = heroAvatarVideo ? heroAvatarVideo.parentElement : null;

    function hideHeroAvatar() {
        if (heroAvatarWrap) {
            heroAvatarWrap.style.transition = 'opacity 0.35s ease';
            heroAvatarWrap.style.opacity = '0';
            heroAvatarWrap.style.pointerEvents = 'none';
        }
        if (_bubbleSlot) {
            _bubbleSlot.style.transition = 'opacity 0.3s ease';
            _bubbleSlot.style.opacity = '0';
            _bubbleSlot.style.pointerEvents = 'none';
        }
    }
    function showHeroAvatar() {
        if (heroAvatarWrap) {
            heroAvatarWrap.style.transition = 'opacity 0.5s ease 0.2s';
            heroAvatarWrap.style.opacity = '1';
            heroAvatarWrap.style.pointerEvents = '';
        }
        if (_bubbleSlot) {
            _bubbleSlot.style.transition = 'opacity 0.5s ease 0.4s';
            _bubbleSlot.style.opacity = '1';
            _bubbleSlot.style.pointerEvents = 'auto';
        }
    }
    window._hideHeroAvatar = hideHeroAvatar;
    window._showHeroAvatar = showHeroAvatar;

    /* Orb pop handler */
    var orbs = document.querySelectorAll('.floating-orb');
    var pops = 0;
    var nudgeTimer = null;
    var usedPos = [];

    function freshPos() {
        var att = 0, best = null;
        while (att < 40) {
            var isT = Math.random() > 0.5, isL = Math.random() > 0.5;
            var p = {};
            p.top = isT ? (10 + Math.random() * 38) + '%' : 'auto';
            p.bottom = isT ? 'auto' : (15 + Math.random() * 32) + '%';
            p.left = isL ? (5 + Math.random() * 33) + '%' : 'auto';
            p.right = isL ? 'auto' : (5 + Math.random() * 33) + '%';
            var ok = true;
            for (var i = 0; i < usedPos.length; i++) {
                var u = usedPos[i];
                if (Math.abs(parseFloat(p.top || 100) - parseFloat(u.top || 100)) < 18 &&
                    Math.abs(parseFloat(p.left || 100) - parseFloat(u.left || 100)) < 18) { ok = false; break; }
            }
            if (ok) { best = p; break; }
            att++;
        }
        if (!best) { usedPos = []; return freshPos(); }
        usedPos.push(best); if (usedPos.length > 8) usedPos.shift();
        return best;
    }

    orbs.forEach(function (orb) {
        orb.style.pointerEvents = 'auto';
        orb.style.cursor = 'pointer';
        orb.addEventListener('mouseenter', function () { if (orb.style.visibility !== 'hidden') orb.style.filter = 'brightness(1.5)'; });
        orb.addEventListener('mouseleave', function () { orb.style.filter = ''; });

        function pop(e) {
            e.preventDefault(); e.stopPropagation();
            clearTimeout(nudgeTimer);
            nudgeTimer = null;

            var rect = orb.getBoundingClientRect();
            var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
            var col = window.getComputedStyle(orb).color;

            // Pop ring
            var ring = document.createElement('div');
            ring.className = 'pop-ring';
            ring.style.cssText = 'width:' + rect.width + 'px;height:' + rect.height + 'px;left:' + (cx - rect.width / 2) + 'px;top:' + (cy - rect.height / 2) + 'px;color:' + col;
            document.body.appendChild(ring);
            setTimeout(function () { ring.remove(); }, 650);

            // Sparks
            for (var i = 0; i < 18; i++) {
                (function (idx) {
                    var sp = document.createElement('div');
                    sp.className = 'spark';
                    var angle = (Math.PI * 2 * idx) / 18;
                    var vel = 48 + Math.random() * 58;
                    var c = COLORS[Math.floor(Math.random() * COLORS.length)];
                    sp.style.cssText = 'width:5px;height:5px;left:' + cx + 'px;top:' + cy + 'px;background:rgb(' + c.r + ',' + c.g + ',' + c.b + ');--tx:' + (Math.cos(angle) * vel) + 'px;--ty:' + (Math.sin(angle) * vel) + 'px;animation-delay:' + (idx * 0.018) + 's';
                    document.body.appendChild(sp);
                    setTimeout(function () { sp.remove(); }, 1400);
                })(i);
            }

            // Canvas burst
            if (window._canvasSpawnNodes) window._canvasSpawnNodes(cx, cy, 10);
            for (var k = 0; k < 20; k++) {
                if (window._canvasAddTrail) window._canvasAddTrail(cx, cy, COLORS[Math.floor(Math.random() * COLORS.length)]);
            }

            // Hide orb, reposition
            orb.style.opacity = '0'; orb.style.visibility = 'hidden'; orb.style.pointerEvents = 'none';
            setTimeout(function () {
                var np = freshPos();
                orb.style.top = np.top; orb.style.bottom = np.bottom;
                orb.style.left = np.left; orb.style.right = np.right;
                setTimeout(function () {
                    orb.style.visibility = 'visible'; orb.style.opacity = '1';
                    orb.style.pointerEvents = 'auto';
                }, 120);
            }, 2800);

            // Clio interaction
            pops++;
            var pm;
            if (milestones[pops]) {
                pm = milestones[pops];
            } else {
                pm = popArc[Math.min(pops - 1, popArc.length - 1)];
            }
            setTimeout(function () {
                if (window._openContextCard) window._openContextCard('hero', cx, cy);
                if (window._showIntTypingThen) window._showIntTypingThen(pm.msg, pm.mood, 300);
            }, 180);
        }

        orb.addEventListener('click', pop);
        orb.addEventListener('touchend', function (e) { e.preventDefault(); pop(e); });
    });
})();
