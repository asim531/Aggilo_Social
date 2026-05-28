/* ══════════════════════════ FIND MY PEOPLE FORM ENGINE (v4 — friction-reduced, AGGIL intact) ══════════════════════════
 *
 * v4 changes (2026-05-25):
 *   - AGGIL parameters fully preserved (birth year, gender, language, interest domain,
 *     location, gathering, duration, what-they-tried). These are the engine — without
 *     them Clio cannot design the cluster or run the intake pipeline.
 *   - Friction reductions only:
 *       · Removed minimum-length requirement on gathering (was 20 chars)
 *       · Removed minimum-length requirement on alreadyTried text (was never required, but
 *         the error message implied it — now chips-only validation, text is optional)
 *       · City is a text input by default; GPS is an optional "detect" button, not the
 *         primary path. The hidden city input is replaced with a visible text input.
 *       · Step counter text ("Step 2 of 7") added alongside the progress dots so users
 *         know there is an end.
 *   - Form version bumped to v4.
 *
 * Screen map (unchanged from v3 except screen 4 city UX):
 *   0 — Welcome
 *   1 — Name + email
 *   2 — Birth year + gender
 *   3 — Language + interest domain
 *   4 — Location (text-first, GPS optional)
 *   5 — Gathering free text (no minimum)
 *   6 — Duration chips
 *   7 — What they tried (chips required, text optional)
 *   8 — Confirmation
 */
(function () {
    'use strict';

    var WAITLIST_ENDPOINT = 'submit.php';
    var EF_TOTAL_STEPS = 7; /* screens 1–7 are data-collection steps */

    /* Detect local/dev environment so submission can be verified without a PHP server.
     * In production (https://aggilo.in) this is false and the live POST runs as normal. */
    function isLocalDev() {
        var p = window.location.protocol;
        var h = window.location.hostname;
        return p === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
    }

    var _efOpen = false;
    window._efOpen = false;
    var _efCurrentScreen = 0;
    var _efData = {};

    /* Cohort calculation (silent, from birth year) */
    function getCohort(year) {
        var y = parseInt(year, 10);
        if (y >= 2001) return 'identity';
        if (y >= 1990) return 'intimacy';
        if (y >= 1980) return 'generativity';
        if (y >= 1970) return 'peak_gen';
        if (y >= 1960) return 'integrity_early';
        return 'integrity';
    }

    /* Detect browser language → map to Aggilo language chip value */
    function detectBrowserLanguage() {
        var lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().substring(0, 2);
        var map = { te: 'telugu', hi: 'hindi', ta: 'tamil', kn: 'kannada', mr: 'marathi', en: 'english' };
        return map[lang] || 'english';
    }

    /* Element refs — populated lazily */
    var efOverlay = null, efBackdrop = null, efCtaBtn = null, efSkipBtn = null;
    var efAsideText = null, efDots = [], efStepCounter = null;
    var efNameInput = null, efEmailInput = null, efCityInput = null;
    var _efInitDone = false;

    function efInit() {
        if (_efInitDone) return;
        _efInitDone = true;
        efOverlay    = document.getElementById('evangelistFormOverlay');
        efBackdrop   = document.getElementById('efBackdrop');
        efCtaBtn     = document.getElementById('efCtaBtn');
        efSkipBtn    = document.getElementById('efSkipBtn');
        efAsideText  = document.getElementById('efAsideText');
        efDots       = document.querySelectorAll('.ef-dot');
        efStepCounter = document.getElementById('efStepCounter');
        efNameInput  = document.getElementById('efName');
        efEmailInput = document.getElementById('efEmail');
        efCityInput  = document.getElementById('efCity');

        if (efCtaBtn) efCtaBtn.addEventListener('click', efAdvance);

        if (efSkipBtn) efSkipBtn.addEventListener('click', function () {
            efCollect(_efCurrentScreen);
            efShowScreen(_efCurrentScreen + 1);
        });

        var efCloseBtn = document.getElementById('efCloseBtn');
        if (efCloseBtn) efCloseBtn.addEventListener('click', closeEvangelistForm);

        /* Backdrop close — only on welcome (0) and confirmation (8) */
        if (efBackdrop) efBackdrop.addEventListener('click', function () {
            if (_efCurrentScreen === 0 || _efCurrentScreen === 8) closeEvangelistForm();
        });

        /* Birth year dropdown */
        var byEl = document.getElementById('efBirthYear');
        if (byEl && byEl.options.length === 1) {
            for (var yy = 2007; yy >= 1940; yy--) {
                var opt = document.createElement('option');
                opt.value = yy; opt.text = yy;
                byEl.appendChild(opt);
            }
            byEl.addEventListener('change', function () { efAdvance(); });
        }

        /* GPS button — optional enhancement on screen 4.
         * City text input is visible by default. GPS fills it if granted. */
        var gpsBtn    = document.getElementById('efGpsBtn');
        var gpsStatus = document.getElementById('efGpsStatus');
        if (gpsBtn) {
            gpsBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (gpsStatus) gpsStatus.textContent = 'Locating…';
                gpsBtn.disabled = true;
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (pos) {
                            /* GPS success — fill the visible city input */
                            if (efCityInput) efCityInput.value = 'GPS:' + pos.coords.latitude.toFixed(4) + ',' + pos.coords.longitude.toFixed(4);
                            if (gpsStatus) { gpsStatus.textContent = 'Location detected.'; gpsStatus.style.color = 'var(--teal)'; }
                            gpsBtn.textContent = '📍 Detected';
                            _efData.gpsLat = pos.coords.latitude;
                            _efData.gpsLng = pos.coords.longitude;
                        },
                        function () {
                            /* GPS denied — city input is already visible, just update status */
                            if (gpsStatus) { gpsStatus.textContent = 'GPS not available — type your city above.'; gpsStatus.style.color = 'var(--text-dim)'; }
                            gpsBtn.disabled = false;
                        }
                    );
                } else {
                    if (gpsStatus) gpsStatus.textContent = 'Type your city above.';
                    gpsBtn.disabled = false;
                }
            });
        }

        /* Gender chips — Screen 2 */
        document.querySelectorAll('#efScreen2 .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#efScreen2 .ef-chip').forEach(function (c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _efData.gender = chip.dataset.val;
                var byVal = document.getElementById('efBirthYear');
                if (byVal && byVal.value) setTimeout(efAdvance, 300);
            });
        });

        /* Language chips — Screen 3 (multi-select) */
        _efData.languages = [];
        var detectedLang = detectBrowserLanguage();
        document.querySelectorAll('#efLangChips .ef-chip').forEach(function (chip) {
            if (chip.dataset.val === detectedLang) {
                chip.classList.add('selected');
                _efData.languages = [detectedLang];
            }
            chip.addEventListener('click', function () {
                chip.classList.toggle('selected');
                var v = chip.dataset.val;
                if (chip.classList.contains('selected')) {
                    if (_efData.languages.indexOf(v) === -1) _efData.languages.push(v);
                } else {
                    _efData.languages = _efData.languages.filter(function (x) { return x !== v; });
                }
                if (_efData.languages.length > 0) {
                    var errLang = document.getElementById('efErrLang');
                    if (errLang) errLang.classList.remove('ef-visible');
                }
            });
        });

        /* Interest domain chips — Screen 3 (single-select, auto-advance) */
        document.querySelectorAll('#efInterestChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#efInterestChips .ef-chip').forEach(function (c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _efData.interestDomain = chip.dataset.val;
                if (_efData.languages && _efData.languages.length > 0) {
                    setTimeout(efAdvance, 350);
                } else {
                    var errLang = document.getElementById('efErrLang');
                    if (errLang) errLang.classList.add('ef-visible');
                }
            });
        });

        /* Duration chips — Screen 6 */
        document.querySelectorAll('#efScreen6 .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('#efScreen6 .ef-chip').forEach(function (c) { c.classList.remove('selected'); });
                chip.classList.add('selected');
                _efData.duration = chip.dataset.val;
                setTimeout(efAdvance, 300);
            });
        });

        /* What they tried chips — Screen 7 (multi-select) */
        document.querySelectorAll('#efTriedChips .ef-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                chip.classList.toggle('selected');
                _efData.triedChips = _efData.triedChips || [];
                var v = chip.dataset.val;
                if (chip.classList.contains('selected')) {
                    if (_efData.triedChips.indexOf(v) === -1) _efData.triedChips.push(v);
                } else {
                    _efData.triedChips = _efData.triedChips.filter(function (x) { return x !== v; });
                }
            });
        });

        /* Enter key for text inputs */
        [efNameInput, efEmailInput, efCityInput].forEach(function (inp) {
            if (!inp) return;
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); efAdvance(); }
            });
        });

        /* Cmd/Ctrl+Enter for textareas + auto-resize */
        ['efGathering', 'efAlreadyTried'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); efAdvance(); }
            });
            el.addEventListener('input', function () {
                el.style.height = 'auto';
                el.style.height = Math.min(190, Math.max(100, el.scrollHeight)) + 'px';
            });
        });
    }

    /* Clio's opening quotes — rotated on each form open.
     * Rules (from SOUL.md):
     *   - No overclaiming. Clio doesn't know the answer yet.
     *   - No manufactured urgency or scarcity.
     *   - Warm but not sycophantic. Specific over generic.
     *   - Each quote should make the user feel like their answer matters.
     */
    var CLIO_OPENING_QUOTES = [
        "The room you're looking for probably already exists. I just need to know where to look.",
        "I've been building rooms for people like you. Tell me what you need.",
        "Say what you're actually looking for. I'll take it from there.",
        "I don't guess. I listen, then I build.",
        "Tell me what you're looking for. I'll find the room.",
        "Most people who come here have been looking for a while. That's usually a good sign.",
        "The more specific you are, the better the room I can build."
    ];

    var _lastQuoteIndex = -1;

    function pickClioQuote() {
        /* Avoid repeating the same quote twice in a row */
        var idx;
        do {
            idx = Math.floor(Math.random() * CLIO_OPENING_QUOTES.length);
        } while (idx === _lastQuoteIndex && CLIO_OPENING_QUOTES.length > 1);
        _lastQuoteIndex = idx;
        return CLIO_OPENING_QUOTES[idx];
    }

    function setClioQuote() {
        var el = document.getElementById('efClioQuote');
        if (!el) {
            console.warn('[Clio] #efClioQuote element not found — quote will not rotate.');
            return;
        }
        var quote = pickClioQuote();
        el.textContent = '\u201c' + quote + '\u201d';
        /* Debug breadcrumb so you can verify in DevTools that rotation is alive. */
        if (window && window.console) {
            console.log('[Clio] Quote set:', quote);
        }
    }

    /* Aside copy keyed by screen index (0–8). Empty on welcome and confirmation. */
    var EF_ASIDE = [
        '',                                                                                        /* 0 welcome */
        'Just the basics. Clio needs a name and a way to reach you.',                              /* 1 name + email */
        'This helps Clio understand where you are in life.',                                       /* 2 birth year + gender */
        'Two signals that help Clio find the right room — your language and what kind of space you need.',  /* 3 language + interest */
        'Clio builds around proximity. She needs to know where to look.',                          /* 4 location */
        'This is the most important thing you can tell Clio. Don\'t overthink it — just say what comes to mind.',  /* 5 gathering */
        'Knowing how long helps Clio understand the weight of what you\'re carrying.',             /* 6 duration */
        'Clio isn\'t judging. She wants to understand what the landscape has been like for you.',  /* 7 tried */
        ''                                                                                         /* 8 confirmation */
    ];

    /* Update progress dots and step counter text */
    function efUpdateDots(screenNum) {
        efDots.forEach(function (dot, i) {
            var dotPos = i + 1;
            dot.className = 'ef-dot';
            dot.style.display = dotPos > EF_TOTAL_STEPS ? 'none' : '';
            if (screenNum === 0) return;
            if (screenNum === 8) { dot.classList.add('past'); return; }
            if (dotPos < screenNum)        dot.classList.add('past');
            else if (dotPos === screenNum) dot.classList.add('current');
        });

        /* Step counter text — "Step 2 of 7" */
        if (efStepCounter) {
            if (screenNum > 0 && screenNum <= EF_TOTAL_STEPS) {
                efStepCounter.textContent = 'Step ' + screenNum + ' of ' + EF_TOTAL_STEPS;
                efStepCounter.style.display = '';
            } else {
                efStepCounter.style.display = 'none';
            }
        }
    }

    /* Show a screen */
    function efShowScreen(n) {
        document.querySelectorAll('.ef-screen').forEach(function (s) { s.classList.remove('ef-active'); });
        var target = document.getElementById('efScreen' + n);
        if (target) target.classList.add('ef-active');
        _efCurrentScreen = n;
        efUpdateDots(n);

        /* Aside */
        var asideLine = EF_ASIDE[n] || '';
        if (efAsideText) efAsideText.classList.remove('ef-aside-visible');
        var asideWrap = document.querySelector('.ef-aside');
        if (asideLine && n > 0 && n < 8) {
            if (asideWrap) asideWrap.style.visibility = 'visible';
            setTimeout(function () {
                if (efAsideText) {
                    efAsideText.textContent = asideLine;
                    efAsideText.classList.add('ef-aside-visible');
                }
            }, 200);
        } else {
            if (asideWrap) asideWrap.style.visibility = 'hidden';
        }

        /* CTA labels */
        var ctaLabels = [
            'I\'m ready \u2192',                   /* 0 */
            'Continue \u2192',                     /* 1 */
            'Continue \u2192',                     /* 2 */
            'That\'s me \u2192',                   /* 3 */
            'That\'s where I am \u2192',           /* 4 — shown only if GPS denied */
            'That\'s it \u2192',                   /* 5 */
            'Continue \u2192',                     /* 6 */
            'That\'s what I\'ve tried \u2192',     /* 7 */
            ''                                     /* 8 confirmation */
        ];
        if (efCtaBtn) {
            efCtaBtn.textContent = ctaLabels[n] || 'Continue \u2192';
            /* Screen 4: CTA always visible (city is text-first now) */
            efCtaBtn.style.display = (n === 8) ? 'none' : '';
        }

        if (efSkipBtn) efSkipBtn.style.display = 'none';

        /* Hide mode tabs on confirmation */
        var modeTabs = document.getElementById('efModeTabs');
        if (modeTabs) modeTabs.style.display = (n === 8) ? 'none' : '';

        /* Auto-focus first text input */
        setTimeout(function () {
            if (!target || n === 0 || n === 8) return;
            var inp = target.querySelector('.ef-input:not([type="hidden"])');
            if (inp && inp.tagName !== 'SELECT') inp.focus();
        }, 450);
    }

    /* Validate current screen */
    function efValidate() {
        document.querySelectorAll('.ef-error-msg').forEach(function (e) { e.classList.remove('ef-visible'); });
        document.querySelectorAll('.ef-input').forEach(function (i) { i.classList.remove('ef-error'); });
        var s = _efCurrentScreen;

        function fail(inputId, msgId) {
            var inp = document.getElementById(inputId);
            var msg = document.getElementById(msgId);
            if (inp) inp.classList.add('ef-error');
            if (msg) msg.classList.add('ef-visible');
            return false;
        }

        /* Screen 1 — name + email */
        if (s === 1) {
            if (!efNameInput || !efNameInput.value.trim()) return fail('efName', 'efErrName');
            var em = efEmailInput ? efEmailInput.value.trim() : '';
            if (!em || em.indexOf('@') === -1 || em.indexOf('.') === -1) return fail('efEmail', 'efErrEmail');
        }

        /* Screen 2 — birth year + gender */
        if (s === 2) {
            var byEl = document.getElementById('efBirthYear');
            var val  = byEl ? byEl.value : '';
            if (!val) return fail('efBirthYear', 'efErrBirthYear');
            var y = parseInt(val, 10);
            if (isNaN(y) || y < 1940 || y > 2007) return fail('efBirthYear', 'efErrBirthYear');
            if (!_efData.gender) return false;
        }

        /* Screen 3 — language + interest domain */
        if (s === 3) {
            if (!_efData.languages || _efData.languages.length === 0) {
                var errLang = document.getElementById('efErrLang');
                if (errLang) errLang.classList.add('ef-visible');
                return false;
            }
            if (!_efData.interestDomain) {
                var errInt = document.getElementById('efErrInterest');
                if (errInt) errInt.classList.add('ef-visible');
                return false;
            }
        }

        /* Screen 4 — city (required, any length — text input is always visible) */
        if (s === 4) {
            if (!efCityInput || !efCityInput.value.trim()) return fail('efCity', 'efErrCity');
        }

        /* Screen 5 — gathering (required, NO minimum length — friction removed) */
        if (s === 5) {
            var v = document.getElementById('efGathering');
            if (!v || !v.value.trim()) return fail('efGathering', 'efErrGathering');
        }

        /* Screen 6 — duration chips */
        if (s === 6) {
            if (!_efData.duration) return false;
        }

        /* Screen 7 — tried chips required, text is optional (friction reduced) */
        if (s === 7) {
            if (!_efData.triedChips || _efData.triedChips.length === 0) {
                var errTried = document.getElementById('efErrAlreadyTried');
                if (errTried) errTried.classList.add('ef-visible');
                return false;
            }
        }

        return true;
    }

    /* Collect data from current screen */
    function efCollect(s) {
        function g(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

        if (s === 1) { _efData.name = g('efName'); _efData.email = g('efEmail'); }
        if (s === 2) {
            _efData.birthYear = parseInt(g('efBirthYear'), 10);
            _efData.cohort    = getCohort(_efData.birthYear);
            /* gender set on chip click */
        }
        /* Screen 3 — languages and interestDomain set via chip click handlers */
        if (s === 4) _efData.location  = g('efCity');
        if (s === 5) _efData.gathering = g('efGathering');
        /* Screen 6 — duration set on chip click */
        if (s === 7) _efData.alreadyTriedText = g('efAlreadyTried'); /* optional text */
    }

    /* Advance to next screen */
    function efAdvance() {
        if (!efValidate()) return;
        efCollect(_efCurrentScreen);
        var next = _efCurrentScreen + 1;
        if (next > 8) next = 8;

        if (_efCurrentScreen === 7) {
            efSubmit();
            efShowScreen(8);
            return;
        }

        efShowScreen(next);
    }

    /* Submit */
    function efSubmit() {
        _efData.submittedAt = new Date().toISOString();
        _efData.formVersion = 'v4';
        _efData.formType    = 'find_my_people';

        var confirmHead = document.getElementById('efConfirmHead');
        if (confirmHead && _efData.name) {
            confirmHead.textContent = 'What you\'re carrying is with Clio now, ' + _efData.name + '.';
        }

        function showSubmitError(msg) {
            var existing = document.getElementById('efSubmitError');
            if (existing) existing.remove();
            var note = document.createElement('p');
            note.id = 'efSubmitError';
            note.style.cssText = 'font-size:0.82rem;color:rgba(244,114,182,0.9);text-align:center;margin-top:14px;line-height:1.55;';
            note.innerHTML = msg;
            var confirmInner = document.querySelector('#efScreen8 .ef-confirm-inner');
            if (confirmInner) confirmInner.appendChild(note);
        }

        /* Local dev path — skip the network and surface the payload so the
         * developer can verify capture without a PHP server. Triggered when the
         * page is opened from file:// or localhost. Production (aggilo.in)
         * always uses the live fetch path below. */
        if (isLocalDev()) {
            console.log('[Clio · DEV] Local environment detected — skipping live POST.');
            console.log('[Clio · DEV] Payload that would be sent to ' + WAITLIST_ENDPOINT + ':');
            console.log(JSON.parse(JSON.stringify(_efData)));
            try {
                var blob = new Blob([JSON.stringify(_efData, null, 2)], { type: 'application/json' });
                var url  = URL.createObjectURL(blob);
                var a    = document.createElement('a');
                a.href = url;
                a.download = 'find-submission-' + Date.now() + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('[Clio · DEV] Could not auto-download payload:', e);
            }
            var devNote = document.createElement('p');
            devNote.style.cssText = 'font-size:0.78rem;color:rgba(45,212,191,0.85);text-align:center;margin-top:14px;line-height:1.55;';
            devNote.innerHTML = '<strong>Local dev mode:</strong> payload logged to console &amp; downloaded as JSON.<br>On <code>aggilo.in</code> this will email <code>mypeople@aggilo.in</code>.';
            var confirmInner = document.querySelector('#efScreen8 .ef-confirm-inner');
            if (confirmInner) confirmInner.appendChild(devNote);
            return;
        }

        function doFetch(attempt) {
            console.log('[Clio] Submitting Find form to', WAITLIST_ENDPOINT, '(attempt', attempt + ')');
            fetch(WAITLIST_ENDPOINT, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(_efData)
            })
            .then(function (response) {
                console.log('[Clio] Find submit response:', response.status);
                if (!response.ok) {
                    return response.json().catch(function () { return {}; }).then(function (body) {
                        throw new Error((body && body.message) ? body.message : 'HTTP ' + response.status);
                    });
                }
                return response.json();
            })
            .then(function (data) {
                if (!data.success) throw new Error(data.message || 'Server error');
                console.log('[Clio] Find submit OK:', data.message);
                var existing = document.getElementById('efSubmitError');
                if (existing) existing.remove();
            })
            .catch(function (err) {
                if (attempt < 2) {
                    setTimeout(function () { doFetch(attempt + 1); }, 2000);
                } else {
                    console.warn('Clio submission failed after retry:', err.message);
                    showSubmitError(
                        'Something went wrong. Email us at ' +
                        '<a href="mailto:hello@aggilo.in" style="color:#2dd4bf">hello@aggilo.in</a> ' +
                        'and we\'ll reach out.'
                    );
                }
            });
        }

        doFetch(1);
    }

    /* Open form — Find My People journey.
     * Hides the mode tabs on open so the user lands directly in the
     * Find journey without cognitive load from the tab switcher.
     * A small "switch" link at the bottom lets them cross over if needed. */
    function openEvangelistForm() {
        efInit();
        _efOpen = true;
        window._efOpen = true;
        _efCurrentScreen = 0;
        _efData = { languages: [], triedChips: [] };

        /* Reset the cross-form mode tracker so the BYC CTA-interceptor
         * doesn't hijack clicks meant for the Find flow. */
        if (window._setFormMode) window._setFormMode('find');

        /* Reset all inputs and chips */
        document.querySelectorAll('#evangelistFormOverlay .ef-input').forEach(function (inp) {
            inp.value = ''; inp.classList.remove('ef-error');
        });
        document.querySelectorAll('#evangelistFormOverlay .ef-chip').forEach(function (c) {
            c.classList.remove('selected');
        });
        document.querySelectorAll('.ef-error-msg').forEach(function (e) {
            e.classList.remove('ef-visible');
        });

        /* Re-apply browser language detection */
        var detectedLang = detectBrowserLanguage();
        var langChip = document.querySelector('#efLangChips .ef-chip[data-val="' + detectedLang + '"]');
        if (langChip) {
            langChip.classList.add('selected');
            _efData.languages = [detectedLang];
        }

        /* Reset GPS state */
        var gpsBtn = document.getElementById('efGpsBtn');
        if (gpsBtn) { gpsBtn.disabled = false; gpsBtn.textContent = '📍 Detect my location instead'; }
        var gpsStatus = document.getElementById('efGpsStatus');
        if (gpsStatus) { gpsStatus.textContent = ''; gpsStatus.style.color = ''; }

        /* Hide tabs — user came from a specific CTA, don't confuse them */
        var modeTabs = document.getElementById('efModeTabs');
        if (modeTabs) modeTabs.style.display = 'none';

        /* Show the journey-switch link */
        showJourneySwitchLink('find');

        /* Set a fresh rotating Clio quote on the welcome screen */
        setClioQuote();

        efShowScreen(0);
        if (efBackdrop) efBackdrop.classList.add('ef-open');
        if (efOverlay)  efOverlay.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    /* Close form */
    function closeEvangelistForm() {
        _efOpen = false;
        window._efOpen = false;
        if (efBackdrop) efBackdrop.classList.remove('ef-open');
        if (efOverlay)  efOverlay.classList.remove('ef-open');
        document.body.style.overflow = '';
    }

    /**
     * Show a small "wrong journey?" switch link at the bottom of the form.
     * This replaces the always-visible tabs — the user only sees the
     * alternative if they actively look for it.
     *
     * @param {'find'|'byc'} currentJourney - which journey is currently active
     */
    function showJourneySwitchLink(currentJourney) {
        var existing = document.getElementById('efJourneySwitchWrap');
        if (existing) existing.remove();

        var wrap = document.createElement('div');
        wrap.id = 'efJourneySwitchWrap';
        wrap.style.cssText = [
            'text-align:center',
            'padding:10px 28px 4px',
            'font-size:0.78rem',
            'color:rgba(226,234,243,0.35)',
        ].join(';');

        var label = currentJourney === 'find'
            ? 'Looking to bring your own group? '
            : 'Looking for a room instead? ';
        var linkText = currentJourney === 'find'
            ? 'Make your crowd →'
            : 'Find my people →';

        wrap.innerHTML = label + '<button type="button" id="efJourneySwitchBtn" style="background:none;border:none;color:var(--teal);font-size:0.78rem;cursor:pointer;font-family:var(--font);padding:0;text-decoration:underline;">' + linkText + '</button>';

        /* Insert before the bottom bar */
        var bottomBar = document.querySelector('#evangelistFormOverlay .ef-bottombar');
        if (bottomBar) bottomBar.parentNode.insertBefore(wrap, bottomBar);

        document.getElementById('efJourneySwitchBtn').addEventListener('click', function () {
            /* Approach: keep tabs hidden — the switch link is the single,
             * low-friction switcher. Avoid surfacing the tabs because that
             * was the original cognitive-load complaint. The receiving
             * open* function will re-render this link with the opposite
             * direction. */
            wrap.remove();
            if (currentJourney === 'find') {
                if (window.openBYCForm) window.openBYCForm();
            } else {
                openEvangelistForm();
            }
        });
    }

    window._showJourneySwitchLink = showJourneySwitchLink;

    window.openEvangelistForm  = openEvangelistForm;
    window.closeEvangelistForm = closeEvangelistForm;
    window._efAdvance = efAdvance;

    /* Escape key */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && _efOpen) closeEvangelistForm();
    });

    /* Wire trigger buttons */
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('#waitlistBtn, #heroCta, [data-open-form]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openEvangelistForm();
            });
        });

        /* Wordmark → close and scroll to hero */
        var efWordmark = document.getElementById('efWordmark');
        if (efWordmark) {
            efWordmark.style.cursor = 'pointer';
            efWordmark.addEventListener('mouseenter', function () { efWordmark.style.opacity = '0.7'; });
            efWordmark.addEventListener('mouseleave', function () { efWordmark.style.opacity = ''; });
            efWordmark.addEventListener('click', function () {
                closeEvangelistForm();
                var hero = document.getElementById('hero');
                if (hero) setTimeout(function () { hero.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
            });
        }
    });
})();
