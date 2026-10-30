"""The Google Analytics tag (GA4) for the network's pages, in one place.

Every public page of this repo and of the sibling sites in GA_SITES carries it between <!-- fob-ga --> markers,
just before </head>. engine/og_cards.py puts it into every page it visits (so the sibling sites' builds, which run
og_cards after building, keep it); this repo's own generators call apply() on the pages they write.
A page that already loads gtag for the same id outside the markers (the homepage template) is left alone.
"""
import re

NETWORK_ID = 'G-CE86H6X7Z7'                        # the followorbounce.github.io property
GA_SITES = {s: NETWORK_ID for s in ('followorbounce.github.io', 'series', 'world-calendar-explorer', 'aerospace', 'soundos',
                                    'anatomy-explorer', 'us-states-atlas', 'country-atlas', 'tarot', 'Maya-Calendar',
                                    'machinery', 'reckoning', 'knots')}
# Sites with a property of their own (created from Herald's Analytics page, 2026-10-29); their tags were added once by hand
# (marinewoodcraft.com pages carry their own og:image, so og_cards skips them; Creative Network deploys from its own repo;
# thefountaingrp.org's tag sits in its Jekyll layout).
OWN_IDS = {'creative-network': 'G-FC4JQR46SK', 'marinewoodcraft.com': 'G-0KPDJ7ZR85', 'thefountaingrp.org': 'G-B17XS5C6EN'}
BLOCK = re.compile(r'[ \t]*<!-- fob-ga -->[\s\S]*?<!-- /fob-ga -->\n?')


def snippet(mid=NETWORK_ID):
    return ('<!-- fob-ga --><script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>\n'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','%s');</script>"
            '<!-- /fob-ga -->\n' % (mid, mid))


def apply(h, mid=NETWORK_ID):
    """The page with exactly one tag for `mid` (idempotent). Pages without a </head> (fragments) are returned unchanged."""
    h = BLOCK.sub('', h)
    if not mid or 'gtag/js?id=' + mid in h or '</head>' not in h.lower():
        return h
    i = h.lower().index('</head>')
    return h[:i] + snippet(mid) + h[i:]
