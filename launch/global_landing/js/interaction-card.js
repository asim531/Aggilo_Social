/* ══════════════════════════ INTERACTION CARD & PROGRESSIVE FORM ══════════════════════════ */
(function () {
    'use strict';

    var WEBM_CLIPS = window._WEBM_CLIPS || [
        'Resting_to_empathy_transparent.webm',
        'resting01_transparent.webm',
        'resting02_transparent.webm'
    ];

    /* ═══════════════ PROGRESSIVE FORM ═══════════════ */
    var pfData = {
        name: '', situation: '', city: '',
        interests: [], community: '', motivation: '', email: ''
    };

    var intCard = document.getElementById('interactionCard');
    var intVideo = document.getElementById('intVideo');
    var intMainMsg = document.getElementById('intMainMsg');
    var intTyping = document.getElementById('intTyping');
    var _currentIntClip = 'rest';

    /* Clio message update */
    function setClioMsg(msg, mood, delay) {
        var d = delay || 0;
        if (d > 0) {
            if (intTyping) intTyping.classList.add('active');
            setTimeout(function () {
                if (intTyping) intTyping.classList.remove('active');
                if (intMainMsg) intMainMsg.textContent = msg;
                swapIntVideo(mood);
            }, d);
        } else {
            if (intMainMsg) intMainMsg.textContent = msg;
            swapIntVideo(mood);
        }
    }

    function swapIntVideo(mood) {
        if (!intVideo) return;
        var rndClip = WEBM_CLIPS[Math.floor(Math.random() * WEBM_CLIPS.length)];
        var clipSrc = 'webm/' + rndClip;
        
        if (_currentIntClip === clipSrc) return;
        _currentIntClip = clipSrc;
        intVideo.style.opacity = '0';
        intVideo.src = clipSrc;
        function onCanPlay() {
            intVideo.removeEventListener('canplay', onCanPlay);
            intVideo.play().catch(function () { });
            intVideo.style.opacity = '1';
        }
        intVideo.addEventListener('canplay', onCanPlay);
        setTimeout(function () {
            intVideo.removeEventListener('canplay', onCanPlay);
            intVideo.style.opacity = '1';
        }, 1500);
    }

    /* Show form step */
    function pfRevealStep(stepId) {
        var step = document.getElementById(stepId);
        if (!step) return;
        step.classList.add('active');
        var form = document.getElementById('pfForm');
        if (form) setTimeout(function () { form.scrollTop = form.scrollHeight; }, 50);
        var inp = step.querySelector('input, textarea');
        if (inp) setTimeout(function () { inp.focus(); }, 80);
    }

    /* Step 1: Name */
    var pfNext1 = document.getElementById('pfNext1');
    if (pfNext1) {
        pfNext1.addEventListener('click', function () {
            var name = document.getElementById('pfName').value.trim();
            if (!name) { document.getElementById('pfName').focus(); return; }
            pfData.name = name;
            setClioMsg(name + '. What\'s your life moment right now?', 'curious', 350);
            pfRevealStep('pfStep2');
        });
    }
    var pfName = document.getElementById('pfName');
    if (pfName) pfName.addEventListener('keydown', function (e) { if (e.key === 'Enter' && pfNext1) pfNext1.click(); });

    /* Step 2: Life moment chips */
    var _lifeMomentPicked = false;
    document.querySelectorAll('#pfStep2 .pf-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            if (_lifeMomentPicked) return;
            _lifeMomentPicked = true;
            pfData.situation = chip.dataset.val;
            chip.classList.add('selected');
            document.querySelectorAll('#pfStep2 .pf-chip').forEach(function (c) {
                c.disabled = true;
                c.style.opacity = c === chip ? '1' : '0.35';
            });
            var msgs = {
                newarrival: 'New place. That takes time to feel real. Which city?',
                transition: 'Big moments need the right people around them. Where are you?',
                rootedbutmissing: 'I know that feeling. The people are there — just not the right ones yet. Where?',
                building: 'Builders need other builders close. Which city?',
                curious: 'Curiosity is the best signal. Where are you based?'
            };
            setClioMsg(msgs[pfData.situation] || 'Good. Where are you based?', 'curious', 400);
            pfRevealStep('pfStep3');
        });
    });

    /* Step 3: City */
    var pfNext3 = document.getElementById('pfNext3');
    if (pfNext3) {
        pfNext3.addEventListener('click', function () {
            var city = document.getElementById('pfCity').value.trim();
            if (!city) { document.getElementById('pfCity').focus(); return; }
            pfData.city = city;
            setClioMsg('What connects you with people you actually respect?', 'curious', 350);
            pfRevealStep('pfStep4');
        });
    }
    var pfCity = document.getElementById('pfCity');
    if (pfCity) pfCity.addEventListener('keydown', function (e) { if (e.key === 'Enter' && pfNext3) pfNext3.click(); });

    /* Step 4: Interest tiles */
    document.querySelectorAll('.pf-tile').forEach(function (tile) {
        tile.addEventListener('click', function () { tile.classList.toggle('selected'); });
    });
    var pfNext4 = document.getElementById('pfNext4');
    if (pfNext4) {
        pfNext4.addEventListener('click', function () {
            var selected = [];
            document.querySelectorAll('.pf-tile.selected').forEach(function (t) { selected.push(t.dataset.tile); });
            pfData.interests = selected;
            pfRevealStep('pfStep5');
            setClioMsg('Do you lead or organise anything — a community, group, or event?', 'curious', 350);
        });
    }

    /* Step 5: Community chips */
    var _communityPicked = false;
    document.querySelectorAll('#pfCommunityChips .pf-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            if (_communityPicked) return;
            _communityPicked = true;
            pfData.community = chip.dataset.val;
            chip.classList.add('selected');
            document.querySelectorAll('#pfCommunityChips .pf-chip').forEach(function (c) {
                c.disabled = true;
                c.style.opacity = c === chip ? '1' : '0.35';
            });
            var msgs = {
                runs: 'I thought so. Now — one last thing before your email.',
                helps: 'That matters. One last thing.',
                wants: 'The impulse says something. One last thing.',
                none: 'That\'s honest. One last thing.'
            };
            setClioMsg(msgs[pfData.community] || 'Good. One last thing.', 'listening', 400);
            pfRevealStep('pfStep6');
        });
    });

    /* Step 6: Email + Submit */
    var pfSubmit = document.getElementById('pfSubmit');
    if (pfSubmit) {
        pfSubmit.addEventListener('click', function () {
            var email = document.getElementById('pfEmail').value.trim();
            if (!email || !email.includes('@')) { document.getElementById('pfEmail').focus(); return; }
            pfData.email = email;
            var msg = document.getElementById('pfConfirmMsg');
            if (msg) msg.textContent = "You're in. I'll come find you when your room is ready. 💫";
            pfRevealStep('pfConfirm');
            setClioMsg("That's everything I need. Watch for me. 👋", 'excited', 350);
            var payload = Object.assign({}, pfData, {
                formType: 'find_my_people',
                formVersion: 'quick_v1',
                submittedAt: new Date().toISOString()
            });
            fetch('submit.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function (response) {
                if (!response.ok) {
                    console.error('Quick Submission failed with status: ' + response.status);
                }
                return response.json();
            })
            .then(function (data) {
                if (!data.success) {
                    console.error('Quick Server error: ' + (data.error || 'Unknown error'));
                } else {
                    console.log('Quick Submission successful');
                }
            })
            .catch(function (err) {
                console.error('Network or system error during quick submission:', err);
            });
        });
    }
    var pfEmail = document.getElementById('pfEmail');
    if (pfEmail) pfEmail.addEventListener('keydown', function (e) { if (e.key === 'Enter' && pfSubmit) pfSubmit.click(); });

    /* ═══════════════ BACKDROP & MODAL ═══════════════ */
    var _backdrop = (function () {
        var bd = document.createElement('div');
        bd.className = 'clio-backdrop';
        document.body.appendChild(bd);
        bd.addEventListener('click', function () { closeModal(); });
        return bd;
    }());

    function openModal() {
        if (!intCard) return;
        intCard.classList.add('mode-modal');
        _backdrop.classList.add('active');
        intCard.style.removeProperty('left');
        intCard.style.removeProperty('top');
        intCard.style.removeProperty('right');
        intCard.style.removeProperty('bottom');
    }

    function closeModal() {
        if (!intCard) return;
        intCard.classList.remove('active', 'mode-modal');
        _backdrop.classList.remove('active');
        chatState = 'CLOSED';
        if (window._showHeroAvatar) window._showHeroAvatar();
    }

    /* Open in FORM mode */
    function openWaitlistForm() {
        if (window._hideHeroAvatar) window._hideHeroAvatar();
        if (intCard) intCard.classList.remove('mode-explore');
        openModal();
        if (intCard) intCard.classList.add('active');
        setClioMsg("Hey. I'm Clio. 👋 I find the people around you who share what you actually care about.", 'happy');
        pfData = { name: '', situation: '', city: '', interests: [], community: '', motivation: '', email: '' };
        _lifeMomentPicked = false;
        _communityPicked = false;
        document.querySelectorAll('.pf-step').forEach(function (s) { s.classList.remove('active'); });
        var step1 = document.getElementById('pfStep1');
        if (step1) step1.classList.add('active');
        var nameInput = document.getElementById('pfName');
        if (nameInput) { nameInput.value = ''; nameInput.focus(); }
        var cityInput = document.getElementById('pfCity');
        if (cityInput) cityInput.value = '';
        document.querySelectorAll('.pf-chip').forEach(function (c) { c.disabled = false; c.style.opacity = ''; c.classList.remove('selected'); });
        document.querySelectorAll('.pf-tile').forEach(function (t) { t.classList.remove('selected'); });
    }

    /* Open in EXPLORE mode */
    function openExploreMode(msg, mood, clickX, clickY) {
        if (window._hideHeroAvatar) window._hideHeroAvatar();
        if (intCard) intCard.classList.add('mode-explore');
        setClioMsg(msg, mood || 'curious');
        positionIntCard(clickX, clickY);
        if (intCard) intCard.classList.add('active');
    }

    var chatState = 'CLOSED';
    var intCloseBtn = document.getElementById('intCloseBtn');
    if (intCloseBtn) {
        intCloseBtn.addEventListener('click', function () {
            if (intCard && intCard.classList.contains('mode-modal')) {
                closeModal();
            } else {
                if (intCard) intCard.classList.remove('active', 'mode-explore');
                chatState = 'CLOSED';
                if (window._showHeroAvatar) window._showHeroAvatar();
            }
        });
    }

    /* Position card near click */
    function positionIntCard(clickX, clickY) {
        if (!intCard) return;
        var cardW = 340, cardH = 280;
        var vw = window.innerWidth, vh = window.innerHeight;
        var pad = 20;
        var left = Math.min(clickX + 24, vw - cardW - pad);
        var top = Math.min(clickY - cardH / 2, vh - cardH - pad);
        if (top < pad) top = pad;
        if (vw <= 600) {
            intCard.style.removeProperty('left');
            intCard.style.removeProperty('top');
            intCard.style.removeProperty('right');
            intCard.style.removeProperty('bottom');
            intCard.style.bottom = '16px';
            intCard.style.right = '16px';
            intCard.style.left = '16px';
            return;
        }
        intCard.style.bottom = 'auto';
        intCard.style.right = 'auto';
        intCard.style.left = left + 'px';
        intCard.style.top = top + 'px';
    }

    function showIntTypingThen(msg, mood, delay) {
        setClioMsg(msg, mood, delay || 600);
    }

    /* ═══════════════ ELEMENT CACHE ═══════════════ */
    var currentContext = 'hero';
    var ELEMENT_CACHE = {
        feat_study: { msg: "I'm building rooms for this right now. You're probably not the only one who shows up alone.", mood: 'curious' },
        feat_weekend: { msg: "Most requested kind of room. People are ready. They just need someone to start the group.", mood: 'happy' },
        feat_clubs: { msg: "I can find you a room for something that already exists, or build one if the interest is there.", mood: 'curious' },
        feat_career: { msg: "People chasing the same thing you are. They're nearby. I see the overlap.", mood: 'excited' },
        feat_housing: { msg: "Compatibility over proximity. I don't rush those rooms. They take a little longer to get right.", mood: 'listening' },
        step_chat: { msg: "It's a conversation. Five minutes. I do the rest.", mood: 'happy' },
        step_find: { msg: "I'm already watching. Rooms are forming near you whether you're on the list or not.", mood: 'curious' },
        step_real: { msg: "The room is the start. What matters is what happens when you actually show up.", mood: 'encouraging' },
        step_done: { msg: "I've seen people spend years surrounded by the wrong crowd. That's what I'm trying to prevent.", mood: 'empathy' },
        faq_waitlist: { msg: "The waitlist isn't a stunt. I won't put you in a room that isn't ready.", mood: 'listening' },
        faq_when: { msg: "Depends on who signs up near you. The more people I have, the faster I can build it right.", mood: 'curious' },
        faq_chatbot: { msg: "I talk to you once. Then I find your cluster. Then I step back. That's on purpose.", mood: 'happy' },
        faq_discord: { msg: "Discord gives you a channel. I give you a room built specifically for you. Different job.", mood: 'happy' },
        faq_free: { msg: "The core match is free. I'm not going to charge you to meet people.", mood: 'happy' },
        hero: { msg: "Pop a bubble. I'll show you what's inside.", mood: 'curious' },
        features: { msg: "Which one caught your eye? I can tell you more.", mood: 'curious' },
        how: { msg: "Simpler than it looks. Want the real version?", mood: 'listening' },
        faq: { msg: "I'm literally here. Ask me anything.", mood: 'happy' },
        problem: { msg: "Yeah. I know that feeling. That's why this exists.", mood: 'empathy' },
        launch: { msg: "Your room is forming. I'll be ready when you are.", mood: 'encouraging' }
    };

    function openContextCard(ctx, clickX, clickY) {
        var data = ELEMENT_CACHE[ctx] || ELEMENT_CACHE[currentContext] || ELEMENT_CACHE['hero'];
        openExploreMode(data.msg, data.mood, clickX, clickY);
    }

    /* Expose globals */
    window._openContextCard = openContextCard;
    window._showIntTypingThen = showIntTypingThen;
    window._openWaitlistForm = openWaitlistForm;
    window._closeModal = closeModal;
    /* Live getter so external code always reads the current chatState */
    Object.defineProperty(window, '_chatState', {
        get: function () { return chatState; },
        configurable: true
    });
    window._intCard = intCard;
    window._backdrop = _backdrop;

    /* Escape for explore card */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !window._efOpen && intCard && intCard.classList.contains('mode-modal')) {
            closeModal();
        }
    });
})();
