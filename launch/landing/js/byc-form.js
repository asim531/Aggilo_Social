/* ══════════════════════════ MAKE YOUR CROWD FORM ENGINE ══════════════════════════ */
(function () {
    'use strict';

    var BYC_ENDPOINT = 'submit.php';

    /* Detect local/dev environment so submission can be verified without a PHP
     * server. In production (https://aggilo.in) this is false and the live
     * POST runs as normal. */
    function isLocalDev() {
        var p = window.location.protocol;
        var h = window.location.hostname;
        return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    }

    var _bycOpen = false;
    var _bycCurrentScreen = 0;
    var _bycData = {};

    /* ── BYC Aside messages per screen ── */
    var BYC_ASIDE = [
        '',
        'Tell Clio about your people. The more specific, the better the room.',
        'This is the credibility core. If you can name what\'s broken, you have a real need.',
        'Clio builds rooms anchored to real places with real languages. This is what makes it yours.',
        'Almost done. Clio evaluates this personally — expect to hear back within 48 hours.',
        ''
    ];

    /* ── BYC CTA labels per screen ── */
    var BYC_CTA = [
        'Tell me about them \u2192',      // 0 welcome
        'Continue \u2192',                 // 1 activity + size
        'Continue \u2192',                 // 2 platform + broken
        'Continue \u2192',                 // 3 demographics
        'Submit \u2192',                   // 4 commitment + contact
        ''                                // 5 confirmation
    ];

    /* ── BYC progress dots: 4 active steps (screens 1–4) ── */
    var BYC_TOTAL_DOTS = 4;

    var _bycInitDone = false;

    function bycInit() {
        if (_bycInitDone) return;
        _bycInitDone = true;

        /* Platform chips — multi-select */
        _bycData.platforms = [];
        document.querySelectorAll('#bycPlatformChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                chip.classList.toggle('selected');
                var v = chip.dataset.val;
                if (chip.classList.contains('selected')) {
                    if (_bycData.platforms.indexOf(v) === -1) _bycData.platforms.push(v);
                } else {
                    _bycData.platforms = _bycData.platforms.filter(function (x) { return x !== v; });
                }
                /* Clear error */
                var err = document.getElementById('bycErrPlatform');
                if (err && _bycData.platforms.length > 0) err.classList.remove('ef-visible');
            });
        });

        /* Language chips — multi-select */
        _bycData.languages = [];
        document.querySelectorAll('#bycLangChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                chip.classList.toggle('selected');
                var v = chip.dataset.val;
                if (chip.classList.contains('selected')) {
                    if (_bycData.languages.indexOf(v) === -1) _bycData.languages.push(v);
                } else {
                    _bycData.languages = _bycData.languages.filter(function (x) { return x !== v; });
                }
                var err = document.getElementById('bycErrLang');
                if (err && _bycData.languages.length > 0) err.classList.remove('ef-visible');
            });
        });

        /* Gender chips — single-select */
        document.querySelectorAll('#bycGenderChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#bycGenderChips .ef-chip').forEach(function (c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _bycData.genderMix = chip.dataset.val;
            });
        });

        /* Timeline chips — single-select */
        document.querySelectorAll('#bycTimelineChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#bycTimelineChips .ef-chip').forEach(function (c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _bycData.timeline = chip.dataset.val;
                var err = document.getElementById('bycErrTimeline');
                if (err) err.classList.remove('ef-visible');
            });
        });

        /* Textarea auto-resize */
        ['bycActivity', 'bycBroken'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function () {
                el.style.height = 'auto';
                el.style.height = Math.min(190, Math.max(100, el.scrollHeight)) + 'px';
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); bycAdvance(); }
            });
        });

        /* Enter key for text inputs */
        ['bycLocation', 'bycName', 'bycEmail', 'bycPhone'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); bycAdvance(); }
            });
        });
    }

    /* ── Show a BYC screen ── */
    function bycShowScreen(n) {
        /* Hide all screens (both EF and BYC) */
        document.querySelectorAll('.ef-screen').forEach(function (s) { s.classList.remove('ef-active'); });
        var target = document.getElementById('bycScreen' + n);
        if (target) target.classList.add('ef-active');
        _bycCurrentScreen = n;

        /* Update dots */
        var efDots = document.querySelectorAll('#efDotsWrap .ef-dot');
        efDots.forEach(function (dot, i) {
            var dotPos = i + 1;
            dot.className = 'ef-dot';
            if (n === 0) return;
            if (n === 5) { dot.classList.add('past'); return; }
            if (dotPos <= BYC_TOTAL_DOTS) {
                if (dotPos < n)       dot.classList.add('past');
                else if (dotPos === n) dot.classList.add('current');
            }
            dot.style.display = dotPos > BYC_TOTAL_DOTS ? 'none' : '';
        });

        /* Step counter text — "Step 2 of 4" */
        var efStepCounter = document.getElementById('efStepCounter');
        if (efStepCounter) {
            if (n > 0 && n <= BYC_TOTAL_DOTS) {
                efStepCounter.textContent = 'Step ' + n + ' of ' + BYC_TOTAL_DOTS;
                efStepCounter.style.display = '';
            } else {
                efStepCounter.style.display = 'none';
            }
        }

        /* Aside */
        var asideText = document.getElementById('efAsideText');
        var asideWrap = document.querySelector('.ef-aside');
        var line = BYC_ASIDE[n] || '';
        if (asideText) asideText.classList.remove('ef-aside-visible');
        if (line && n > 0 && n < 5) {
            if (asideWrap) asideWrap.style.visibility = 'visible';
            setTimeout(function () {
                asideText.textContent = line;
                asideText.classList.add('ef-aside-visible');
            }, 200);
        } else {
            if (asideWrap) asideWrap.style.visibility = 'hidden';
        }

        /* CTA */
        var efCtaBtn = document.getElementById('efCtaBtn');
        if (efCtaBtn) {
            efCtaBtn.textContent = BYC_CTA[n] || 'Continue \u2192';
            efCtaBtn.style.display = (n === 5) ? 'none' : '';
        }
        var efSkipBtn = document.getElementById('efSkipBtn');
        if (efSkipBtn) efSkipBtn.style.display = 'none';

        /* Hide mode tabs on confirmation */
        var modeTabs = document.getElementById('efModeTabs');
        if (modeTabs) modeTabs.style.display = (n === 5) ? 'none' : '';

        /* Auto-focus first text input */
        setTimeout(function () {
            if (!target || n === 0 || n === 5) return;
            var inp = target.querySelector('.ef-input:not([type="hidden"])');
            if (inp && inp.tagName !== 'SELECT') inp.focus();
        }, 450);
    }

    /* ── Validate current BYC screen ── */
    function bycValidate() {
        document.querySelectorAll('.ef-error-msg').forEach(function (e) { e.classList.remove('ef-visible'); });
        document.querySelectorAll('.ef-input').forEach(function (i) { i.classList.remove('ef-error'); });
        var s = _bycCurrentScreen;

        function fail(inputId, msgId) {
            var inp = document.getElementById(inputId);
            var msg = document.getElementById(msgId);
            if (inp) inp.classList.add('ef-error');
            if (msg) msg.classList.add('ef-visible');
            return false;
        }

        /* Screen 1 — activity + size */
        if (s === 1) {
            var act = document.getElementById('bycActivity');
            if (!act || !act.value.trim()) return fail('bycActivity', 'bycErrActivity');
            var size = document.getElementById('bycSize');
            if (!size || !size.value || parseInt(size.value) < 2) return fail('bycSize', 'bycErrSize');
        }

        /* Screen 2 — platforms + what's broken */
        if (s === 2) {
            if (!_bycData.platforms || _bycData.platforms.length === 0) {
                var errP = document.getElementById('bycErrPlatform');
                if (errP) errP.classList.add('ef-visible');
                return false;
            }
            var broken = document.getElementById('bycBroken');
            if (!broken || !broken.value.trim()) return fail('bycBroken', 'bycErrBroken');
        }

        /* Screen 3 — location + language */
        if (s === 3) {
            var loc = document.getElementById('bycLocation');
            if (!loc || !loc.value.trim()) return fail('bycLocation', 'bycErrLocation');
            if (!_bycData.languages || _bycData.languages.length === 0) {
                var errL = document.getElementById('bycErrLang');
                if (errL) errL.classList.add('ef-visible');
                return false;
            }
        }

        /* Screen 4 — timeline + name + email */
        if (s === 4) {
            if (!_bycData.timeline) {
                var errT = document.getElementById('bycErrTimeline');
                if (errT) errT.classList.add('ef-visible');
                return false;
            }
            var name = document.getElementById('bycName');
            if (!name || !name.value.trim()) return fail('bycName', 'bycErrName');
            var email = document.getElementById('bycEmail');
            var em = email ? email.value.trim() : '';
            if (!em || em.indexOf('@') === -1 || em.indexOf('.') === -1) return fail('bycEmail', 'bycErrEmail');
        }

        return true;
    }

    /* ── Collect data from current screen ── */
    function bycCollect(s) {
        function g(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

        if (s === 1) {
            _bycData.activity = g('bycActivity');
            _bycData.communitySize = parseInt(g('bycSize'), 10) || 0;
        }
        if (s === 2) {
            _bycData.whatsBroken = g('bycBroken');
            /* platforms set via chip click */
        }
        if (s === 3) {
            _bycData.location = g('bycLocation');
            /* languages set via chip click */
            _bycData.ageMin = parseInt(g('bycAgeMin'), 10) || null;
            _bycData.ageMax = parseInt(g('bycAgeMax'), 10) || null;
            /* genderMix set via chip click */
        }
        if (s === 4) {
            _bycData.name = g('bycName');
            _bycData.email = g('bycEmail');
            _bycData.phone = g('bycPhone');
            /* timeline set via chip click */
        }
    }

    /* ── Advance to next screen ── */
    function bycAdvance() {
        if (!bycValidate()) return;
        bycCollect(_bycCurrentScreen);
        var next = _bycCurrentScreen + 1;
        if (next > 5) next = 5;

        /* Submit on final advance from screen 4 */
        if (_bycCurrentScreen === 4) {
            bycSubmit();
            bycShowScreen(5);
            return;
        }

        bycShowScreen(next);
    }

    /* ── Submit BYC data ── */
    function bycSubmit() {
        _bycData.submittedAt = new Date().toISOString();
        _bycData.formType    = 'make_your_crowd';
        _bycData.formVersion = 'v1';

        /* Personalise confirmation */
        var confirmHead = document.getElementById('bycConfirmHead');
        if (confirmHead && _bycData.name) {
            confirmHead.textContent = 'I\'ve got everything, ' + _bycData.name + '.';
        }

        /* Helper — show an error note on the BYC confirmation screen */
        function showBycError(msg) {
            var existing = document.getElementById('bycSubmitError');
            if (existing) existing.remove();
            var note = document.createElement('p');
            note.id = 'bycSubmitError';
            note.style.cssText = 'font-size:0.82rem;color:rgba(244,114,182,0.9);text-align:center;margin-top:14px;line-height:1.55;';
            note.innerHTML = msg;
            var inner = document.querySelector('#bycScreen5 .ef-confirm-inner');
            if (inner) inner.appendChild(note);
        }

        /* Local dev path — same approach as evangelist-form.js, skip the live
         * POST and surface the payload so capture can be verified without a
         * PHP server running. */
        if (isLocalDev()) {
            console.log('[Clio · DEV] Local environment detected — skipping live POST.');
            console.log('[Clio · DEV] MYC payload that would be sent to ' + BYC_ENDPOINT + ':');
            console.log(JSON.parse(JSON.stringify(_bycData)));
            try {
                var blob = new Blob([JSON.stringify(_bycData, null, 2)], { type: 'application/json' });
                var url  = URL.createObjectURL(blob);
                var a    = document.createElement('a');
                a.href = url;
                a.download = 'myc-submission-' + Date.now() + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('[Clio · DEV] Could not auto-download payload:', e);
            }
            var devNote = document.createElement('p');
            devNote.style.cssText = 'font-size:0.78rem;color:rgba(45,212,191,0.85);text-align:center;margin-top:14px;line-height:1.55;';
            devNote.innerHTML = '<strong>Local dev mode:</strong> payload logged to console &amp; downloaded as JSON.<br>On <code>aggilo.in</code> this will email <code>mycrowd@aggilo.in</code>.';
            var inner = document.querySelector('#bycScreen5 .ef-confirm-inner');
            if (inner) inner.appendChild(devNote);
            return;
        }

        /* Core fetch with one retry */
        function doFetch(attempt) {
            console.log('[Clio] Submitting MYC form to', BYC_ENDPOINT, '(attempt', attempt + ')');
            fetch(BYC_ENDPOINT, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(_bycData)
            })
            .then(function (response) {
                console.log('[Clio] MYC submit response:', response.status);
                if (!response.ok) {
                    return response.json().catch(function () { return {}; }).then(function (body) {
                        var serverMsg = (body && body.message) ? body.message : 'HTTP ' + response.status;
                        throw new Error(serverMsg);
                    });
                }
                return response.json();
            })
            .then(function (data) {
                if (!data.success) {
                    throw new Error(data.message || 'Server error');
                }
                console.log('[Clio] MYC submit OK:', data.message);
                /* Success — clear any prior error */
                var existing = document.getElementById('bycSubmitError');
                if (existing) existing.remove();
            })
            .catch(function (err) {
                if (attempt < 2) {
                    setTimeout(function () { doFetch(attempt + 1); }, 2000);
                } else {
                    console.warn('BYC submission failed after retry:', err.message);
                    showBycError(
                        'Something went wrong sending your details. ' +
                        'Please email us directly at ' +
                        '<a href="mailto:mycrowd@aggilo.in" style="color:#2dd4bf">mycrowd@aggilo.in</a> ' +
                        'and we\'ll be in touch.'
                    );
                }
            });
        }

        doFetch(1);
    }

    /* ══ Mode Tab Switching ══ */
    var _currentMode = 'find'; // 'find' or 'byc'

    function switchToFindMode() {
        _currentMode = 'find';
        var tabFind = document.getElementById('efTabFind');
        var tabBYC = document.getElementById('efTabBYC');
        if (tabFind) { tabFind.classList.add('ef-mode-active'); }
        if (tabBYC) { tabBYC.classList.remove('ef-mode-active'); }

        /* Reset dots to 7 */
        var dots = document.querySelectorAll('#efDotsWrap .ef-dot');
        dots.forEach(function (d) { d.style.display = ''; });

        /* Rebind CTA to efAdvance */
        var cta = document.getElementById('efCtaBtn');
        if (cta) {
            cta.onclick = null;
            cta.addEventListener('click', function handler() {
                if (_currentMode === 'find' && window._efAdvance) window._efAdvance();
            });
        }

        /* Show EF screen 0 */
        if (window.openEvangelistForm) {
            /* Full reset handled by openEvangelistForm */
            window.openEvangelistForm();
        }
    }

    function switchToBYCMode() {
        bycInit();
        _currentMode = 'byc';
        var tabFind = document.getElementById('efTabFind');
        var tabBYC = document.getElementById('efTabBYC');
        if (tabFind) { tabFind.classList.remove('ef-mode-active'); }
        if (tabBYC) { tabBYC.classList.add('ef-mode-active'); }

        /* Refresh the journey-switch link so it points BACK to Find.
         * Without this, switching via the visible mode tabs would leave
         * the prior Find→BYC link in the DOM, mismatching the active form. */
        if (window._showJourneySwitchLink) window._showJourneySwitchLink('byc');

        /* Reset BYC data */
        _bycData = { platforms: [], languages: [] };
        _bycCurrentScreen = 0;

        /* Reset BYC inputs */
        ['bycActivity', 'bycBroken', 'bycLocation', 'bycName', 'bycEmail', 'bycPhone', 'bycSize', 'bycAgeMin', 'bycAgeMax'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.value = ''; el.classList.remove('ef-error'); }
        });
        document.querySelectorAll('#bycPlatformChips .ef-chip, #bycLangChips .ef-chip, #bycGenderChips .ef-chip, #bycTimelineChips .ef-chip').forEach(function (c) {
            c.classList.remove('selected');
        });
        document.querySelectorAll('.ef-error-msg').forEach(function (e) { e.classList.remove('ef-visible'); });

        /* Update dots for BYC (4 steps) */
        var dots = document.querySelectorAll('#efDotsWrap .ef-dot');
        dots.forEach(function (d, i) {
            d.style.display = (i + 1) > BYC_TOTAL_DOTS ? 'none' : '';
            d.className = 'ef-dot';
        });

        /* NOTE: do NOT unhide #efModeTabs here. The tabs are intentionally
         * hidden by openBYCForm() / openEvangelistForm() so the user lands
         * directly in the chosen journey without cognitive load. The user
         * can switch journeys via the explicit "switch link" rendered by
         * showJourneySwitchLink(). The only path that should reveal the
         * tabs again is when the user actively clicks that switch link. */

        bycShowScreen(0);
    }

    /* ══ Open MYC form directly (from landing page "Make your crowd" button) ══ */
    function openBYCForm() {
        bycInit();
        /* Open the overlay first */
        var efOverlay = document.getElementById('evangelistFormOverlay');
        var efBackdrop = document.getElementById('efBackdrop');
        if (efBackdrop) efBackdrop.classList.add('ef-open');
        if (efOverlay) efOverlay.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
        window._efOpen = true;

        /* Hide tabs — user came from the MYC CTA, don't confuse them */
        var modeTabs = document.getElementById('efModeTabs');
        if (modeTabs) modeTabs.style.display = 'none';

        /* Show the journey-switch link (defined in evangelist-form.js) */
        if (window._showJourneySwitchLink) window._showJourneySwitchLink('byc');

        switchToBYCMode();
    }

    /* ══ Wire up ══ */
    document.addEventListener('DOMContentLoaded', function () {
        /* Mode tab clicks */
        var tabFind = document.getElementById('efTabFind');
        var tabBYC = document.getElementById('efTabBYC');
        if (tabFind) tabFind.addEventListener('click', function () {
            if (_currentMode === 'find') return;
            switchToFindMode();
        });
        if (tabBYC) tabBYC.addEventListener('click', function () {
            if (_currentMode === 'byc') return;
            switchToBYCMode();
        });

        /* "Make your crowd" buttons on landing page */
        document.querySelectorAll('[data-open-byc]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openBYCForm();
            });
        });

        /* Intercept CTA button for BYC mode */
        var cta = document.getElementById('efCtaBtn');
        if (cta) {
            /* Wrap existing click so we can intercept for BYC */
            var origClick = cta.onclick;
            cta.onclick = null;
            cta.addEventListener('click', function (e) {
                if (_currentMode === 'byc') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    bycAdvance();
                }
                /* If 'find' mode, the original evangelist-form.js handler fires */
            });
        }

        /* Backdrop close for BYC — same rules as EF */
        var efBackdrop = document.getElementById('efBackdrop');
        if (efBackdrop) {
            efBackdrop.addEventListener('click', function () {
                if (_currentMode === 'byc' && (_bycCurrentScreen === 0 || _bycCurrentScreen === 5)) {
                    window.closeEvangelistForm();
                }
            });
        }
    });

    /* Expose for external use */
    window.openBYCForm = openBYCForm;
    window._bycAdvance = bycAdvance;
    window._currentFormMode = function () { return _currentMode; };
    window._setFormMode = function (m) {
        if (m === 'find' || m === 'byc') _currentMode = m;
    };
})();
