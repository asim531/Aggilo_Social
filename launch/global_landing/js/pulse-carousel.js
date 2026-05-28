/* ══════════════════════════ PULSE CAROUSEL ══════════════════════════ */
(function () {
    'use strict';

    var CLUSTERS = [
        {
            name: "UX — Indian Mobile Contexts",
            meta: "8 members · Hyderabad",
            note: "<strong>Clio is watching</strong> what is shifting in Indian mobile UX — app updates, research papers, practitioner discoveries. She surfaces what is current and worth knowing. One or two things a day.",
            items: [
                {
                    time: "2h ago",
                    frame: "Something shifted in the IRCTC app this week —",
                    card: {
                        src: "Product Engineering Blog",
                        head: "IRCTC updated regional language input on older Android builds",
                        hook: "The touch compensation logic is now overriding the system keyboard on sub-5-inch screens. First time a national app has done this at scale."
                    }
                },
                {
                    time: "Yesterday",
                    frame: "Worth noting for accessible design in Indian contexts —",
                    card: {
                        src: "Inclusion Lab · IIT Delhi",
                        head: "Thumb reach mapping for Indian smartphones differs from Western UX baselines",
                        hook: "The dominant grip on sub-6-inch devices in India centres touch 8mm lower than Stanford's standard model. Most international design systems are calibrated wrong."
                    }
                }
            ]
        },
        {
            name: "NEET 2025 Preparation · Hyd",
            meta: "12 members · Hyderabad",
            note: "<strong>Clio is tracking</strong> the NEET preparation cycle in real time — exam pattern shifts, which resources are landing this year, what the mock series are revealing. What would take hours across ten forums comes in once, here.",
            items: [
                {
                    time: "4h ago",
                    frame: "Biology weightage pattern worth watching this cycle —",
                    card: {
                        src: "NTA Bulletin · Dec 2024",
                        head: "Ecology and biodiversity trending toward applied scenarios in recent mock series",
                        hook: "Three test series have shifted from factual recall to application-based questions in the ecology unit. Standard textbook coverage may be underweighting this."
                    }
                },
                {
                    time: "8h ago",
                    frame: "Resource signal worth noting —",
                    card: {
                        src: "Prep Community Analysis",
                        head: "NCERT Exemplar problems correlating strongly with NTA question formats this year",
                        hook: "Exemplar questions in chapters 13–16 are appearing almost verbatim in recent mocks. Most coaching material underuses them."
                    }
                }
            ]
        },
        {
            name: "Weekend Football · Bengaluru",
            meta: "9 members · Indiranagar",
            note: "<strong>Clio is watching</strong> ground availability, weather windows, and local sports infrastructure. When a slot opens she surfaces it immediately. The coordination that used to take a dozen messages takes one.",
            items: [
                {
                    time: "3h ago",
                    frame: "Ground availability this weekend —",
                    card: {
                        src: "BFC Community Ground",
                        head: "Indiranagar turf has a slot open Saturday 7–9am, currently unbooked",
                        hook: "Slot opened an hour ago. 100 Feet Road location — artificial turf, floodlights available."
                    }
                },
                {
                    time: "Yesterday",
                    frame: "Weather note for planning —",
                    card: {
                        src: "IMD Bengaluru Forecast",
                        head: "Saturday morning clear, rain expected from 2pm onward",
                        hook: "Morning window is clean. If you are booking a ground this weekend, morning is the reliable slot."
                    }
                }
            ]
        },
        {
            name: "Early Childhood · Pune",
            meta: "7 members · Pune",
            note: "<strong>Clio is tracking</strong> current child development and nutrition research — what Indian practitioners are actually recommending, distinct from what went viral online. She filters the noise and surfaces what is worth a second look.",
            items: [
                {
                    time: "6h ago",
                    frame: "Nutritional guidance has shifted more than most paediatric advice reflects —",
                    card: {
                        src: "Indian Academy of Pediatrics · 2024",
                        head: "Iron supplementation timing guidelines revised for exclusively breastfed infants",
                        hook: "Updated IAP guidance moves the start window earlier and adjusts dosage for Indian dietary patterns. Most online resources still show the 2019 guidelines."
                    }
                },
                {
                    time: "Yesterday",
                    frame: "Language development signal worth noting —",
                    card: {
                        src: "Azim Premji University Research · 2024",
                        head: "Bilingual home environments showing stronger early literacy outcomes in Indian study cohorts",
                        hook: "The research covers 2,400 children across Maharashtra and Karnataka. The pattern holds across income levels."
                    }
                }
            ]
        }
    ];

    function face(s) {
        s = s || 32;
        return '<img src="../clio/assets/source/resting01.png" width="' + s + '" height="' + s + '" style="border-radius:50%; object-fit:cover;">';
    }

    var cur = 0;
    var timer = null;

    function render() {
        var d = CLUSTERS[cur];

        var noteAv = document.getElementById('note-av');
        var noteText = document.getElementById('note-text');
        var cname = document.getElementById('cname');
        var cmeta = document.getElementById('cmeta');
        if (noteAv) noteAv.innerHTML = face(32);
        if (noteText) noteText.innerHTML = d.note;
        if (cname) cname.textContent = d.name;
        if (cmeta) cmeta.textContent = d.meta;

        var feed = document.getElementById('pulse-feed');
        if (!feed) return;
        feed.innerHTML = '';
        var typing = document.getElementById('typing');
        if (typing) typing.classList.add('show');

        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            if (typing) typing.classList.remove('show');
            d.items.forEach(function (item, i) {
                setTimeout(function () {
                    var el = document.createElement('div');
                    el.className = 'feed-item';
                    el.innerHTML =
                        '<div class="crow">' +
                        '<div class="cav">' + face(32) + '</div>' +
                        '<div style="flex:1">' +
                        '<span class="clabel">Clio</span>' +
                        '<span class="ts">' + item.time + '</span>' +
                        '<div class="frame">' + item.frame + '</div>' +
                        '</div></div>' +
                        '<div class="ccard">' +
                        '<div class="csrc">' + item.card.src + '</div>' +
                        '<div class="chead">' + item.card.head + '</div>' +
                        '<div class="chook">' + item.card.hook + '</div>' +
                        '</div>';
                    feed.appendChild(el);
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () { el.classList.add('vis'); });
                    });
                }, i * 220);
            });
        }, 650);

        var prevBtn = document.getElementById('prev-btn');
        var nextBtn = document.getElementById('next-btn');
        if (prevBtn) prevBtn.disabled = cur === 0;
        if (nextBtn) nextBtn.disabled = cur === CLUSTERS.length - 1;

        var dc = document.getElementById('dots');
        if (dc) {
            dc.innerHTML = '';
            CLUSTERS.forEach(function (_, i) {
                var dot = document.createElement('div');
                dot.className = 'nav-dot' + (i === cur ? ' on' : '');
                dot.onclick = function () { cur = i; render(); };
                dc.appendChild(dot);
            });
        }
    }

    window.pulseGo = function (dir) {
        var n = cur + dir;
        if (n < 0 || n >= CLUSTERS.length) return;
        cur = n;
        render();
    };

    // Trigger render when pulse section enters viewport
    var pulseObserved = false;
    var pulseSec = document.getElementById('pulse');
    if (pulseSec) {
        var pulseObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !pulseObserved) {
                pulseObserved = true;
                render();
            }
        }, { threshold: 0.2 });
        pulseObs.observe(pulseSec);
    } else {
        render();
    }
})();
