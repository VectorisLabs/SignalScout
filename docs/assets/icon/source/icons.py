# Writes the SignalScout content icons as light and dark SVG pairs, one mark per README topic.
# Usage: uv run python -I docs/assets/icon/source/icons.py docs/assets/icon
# Tokens: I forest stroke and fill, L lime signal, N quiet neutral, H ground (cut-outs), W warn.
import sys

pal = {'light': {'I': '#146044', 'L': '#C9F269', 'N': '#C9D3CB', 'H': '#FFFFFF', 'W': '#b4531f'},
       'dark': {'I': '#7fd3a8', 'L': '#C9F269', 'N': '#3a5a50', 'H': '#0d1117', 'W': '#f0a070'}}

s = 'fill="none" stroke="{I}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"'
n = 'fill="none" stroke="{N}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"'

icons = {
    # Navigation
    'play': '<rect x="8" y="18" width="84" height="60" rx="14" fill="{I}"/><path d="M42 34 L64 48 L42 62Z" fill="{L}"/><path d="M30 90 H70" ' + n + '/>',
    'flow': '<path d="M24 50 H76" ' + n + '/><circle cx="16" cy="50" r="11" fill="{I}"/><circle cx="50" cy="50" r="11" fill="{I}"/><circle cx="84" cy="50" r="12" fill="{L}" stroke="{I}" stroke-width="5"/>',
    'layers': '<path d="M50 62 L90 74 L50 88 L10 74Z" fill="{N}"/><path d="M50 38 L90 52 L50 66 L10 52Z" fill="{I}"/><path d="M50 12 L90 26 L50 40 L10 26Z" fill="{L}" stroke="{I}" stroke-width="5" stroke-linejoin="round"/>',
    'terminal': '<rect x="8" y="14" width="84" height="72" rx="14" fill="{I}"/><path d="M26 38 L40 50 L26 62" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 64 H72" stroke="{L}" stroke-width="8" stroke-linecap="round"/>',
    'braces': '<path d="M34 12 C20 12 24 34 22 44 C21 48 16 50 10 50 C16 50 21 52 22 56 C24 66 20 88 34 88" ' + s + '/><path d="M66 12 C80 12 76 34 78 44 C79 48 84 50 90 50 C84 50 79 52 78 56 C76 66 80 88 66 88" ' + s + '/><circle cx="50" cy="50" r="10" fill="{L}" stroke="{I}" stroke-width="5"/>',
    'cloud-code': '<path d="M28 78 C12 78 8 58 22 52 C20 34 42 26 52 38 C60 24 86 30 82 50 C96 54 92 78 76 78Z" fill="{I}"/><path d="M42 50 L34 58 L42 66 M58 50 L66 58 L58 66" fill="none" stroke="{L}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    # Trust
    'shield-check': '<path d="M50 8 L86 22 V48 C86 70 70 86 50 94 C30 86 14 70 14 48 V22Z" fill="{I}"/><path d="M33 50 L45 62 L68 38" fill="none" stroke="{L}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
    'hourglass': '<path d="M22 10 H78 M22 90 H78" ' + s + '/><path d="M28 12 C28 36 46 42 46 50 C46 58 28 64 28 88 H72 C72 64 54 58 54 50 C54 42 72 36 72 12Z" fill="none" stroke="{I}" stroke-width="6" stroke-linejoin="round"/><path d="M36 84 C38 72 46 68 50 62 C54 68 62 72 64 84Z" fill="{L}"/>',
    'logic-chip': '<path d="M30 10 V20 M50 10 V20 M70 10 V20 M30 80 V90 M50 80 V90 M70 80 V90 M10 30 H20 M10 50 H20 M10 70 H20 M80 30 H90 M80 50 H90 M80 70 H90" ' + n + '/><rect x="20" y="20" width="60" height="60" rx="12" fill="{I}"/><path d="M36 44 H64 M36 58 H52" stroke="{L}" stroke-width="7" stroke-linecap="round"/>',
    'debate': '<path d="M8 20 C8 14 12 10 18 10 H52 C58 10 62 14 62 20 V42 C62 48 58 52 52 52 H28 L16 62 V52 C11 51 8 48 8 42Z" fill="{I}"/><path d="M92 46 C92 40 88 36 82 36 H48 C42 36 38 40 38 46 V68 C38 74 42 78 48 78 H72 L84 88 V78 C89 77 92 74 92 68Z" fill="{L}" stroke="{I}" stroke-width="5" stroke-linejoin="round"/><path d="M54 57 H76" stroke="{I}" stroke-width="6" stroke-linecap="round"/>',
    'receipt': '<path d="M20 8 H80 V92 L70 84 L60 92 L50 84 L40 92 L30 84 L20 92Z" fill="{I}"/><path d="M32 28 H68 M32 44 H58" stroke="{H}" stroke-width="6" stroke-linecap="round"/><circle cx="62" cy="64" r="11" fill="{L}"/><path d="M56 64 L60 68 L68 60" fill="none" stroke="{I}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    'data-gap': '<rect x="10" y="44" width="18" height="44" rx="5" fill="{I}"/><rect x="41" y="24" width="18" height="64" rx="5" fill="none" stroke="{W}" stroke-width="5" stroke-dasharray="8 6"/><rect x="72" y="34" width="18" height="54" rx="5" fill="{I}"/><path d="M50 8 V14" stroke="{W}" stroke-width="7" stroke-linecap="round"/>',
    # Non-claims
    'no-crystal': '<circle cx="50" cy="44" r="32" fill="{N}"/><path d="M28 90 H72 L64 74 H36Z" fill="{I}"/><circle cx="40" cy="34" r="7" fill="{H}"/><path d="M14 86 L86 14" stroke="{W}" stroke-width="8" stroke-linecap="round"/>',
    'no-dice': '<rect x="16" y="16" width="68" height="68" rx="16" fill="{N}"/><circle cx="35" cy="35" r="6" fill="{I}"/><circle cx="50" cy="50" r="6" fill="{I}"/><circle cx="65" cy="65" r="6" fill="{I}"/><path d="M12 88 L88 12" stroke="{W}" stroke-width="8" stroke-linecap="round"/>',
    'human-review': '<circle cx="42" cy="30" r="18" fill="{I}"/><path d="M8 90 C8 66 22 56 42 56 C62 56 76 66 76 90Z" fill="{I}"/><circle cx="76" cy="70" r="16" fill="{L}" stroke="{H}" stroke-width="4"/><path d="M68 70 L74 76 L84 64" fill="none" stroke="{I}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    'rewind': '<path d="M22 30 A34 34 0 1 1 16 54" ' + s + '/><path d="M8 22 L22 32 L32 16" ' + s + '/><path d="M50 32 V52 L64 60" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
    # Agents
    'hub': '<path d="M50 50 L50 14 M50 50 L18 74 M50 50 L82 74" ' + n + '/><circle cx="50" cy="14" r="10" fill="{I}"/><circle cx="18" cy="76" r="10" fill="{I}"/><circle cx="82" cy="76" r="10" fill="{I}"/><circle cx="50" cy="50" r="17" fill="{L}" stroke="{I}" stroke-width="6"/>',
    'crawl': '<path d="M14 8 H50 L64 22 V74 H14Z" fill="{N}"/><path d="M24 30 H48 M24 44 H44" stroke="{H}" stroke-width="6" stroke-linecap="round"/><circle cx="58" cy="58" r="20" fill="{H}" stroke="{I}" stroke-width="8"/><circle cx="58" cy="58" r="8" fill="{L}"/><path d="M73 73 L90 90" ' + s + '/>',
    'correlate': '<path d="M20 22 L80 30 L50 82 Z M20 22 L50 50 M80 30 L50 50 M50 82 L50 50" fill="none" stroke="{N}" stroke-width="5" stroke-linejoin="round"/><circle cx="20" cy="22" r="10" fill="{I}"/><circle cx="80" cy="30" r="10" fill="{I}"/><circle cx="50" cy="82" r="10" fill="{I}"/><circle cx="50" cy="50" r="13" fill="{L}" stroke="{I}" stroke-width="5"/>',
    'swords': '<path d="M18 14 L72 68 M82 14 L28 68" ' + s + '/><path d="M60 76 L76 60 M24 60 L40 76" stroke="{L}" stroke-width="9" stroke-linecap="round"/><path d="M76 76 L88 88 M24 76 L12 88" ' + s + '/>',
    # Pipeline steps
    'funnel': '<circle cx="24" cy="10" r="6" fill="{N}"/><circle cx="50" cy="8" r="6" fill="{N}"/><circle cx="76" cy="12" r="6" fill="{N}"/><path d="M10 24 H90 L60 58 V86 L40 94 V58Z" fill="{I}"/><circle cx="50" cy="38" r="7" fill="{L}"/>',
    'gauge': '<path d="M12 70 A38 38 0 0 1 88 70" ' + n + '/><path d="M12 70 A38 38 0 0 1 68 37" ' + s + '/><path d="M50 70 L76 42" stroke="{I}" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="70" r="10" fill="{L}" stroke="{I}" stroke-width="5"/>',
    'compass': '<circle cx="50" cy="50" r="40" fill="none" stroke="{I}" stroke-width="8"/><path d="M50 18 L60 50 L50 82 L40 50Z" fill="{N}"/><path d="M50 18 L60 50 H40Z" fill="{L}" stroke="{I}" stroke-width="4" stroke-linejoin="round"/>',
    # Backtests
    'bag': '<path d="M34 34 V26 C34 14 42 8 50 8 C58 8 66 14 66 26 V34" ' + s + '/><path d="M16 30 H84 L78 92 H22Z" fill="{I}"/><path d="M30 58 H70" stroke="{L}" stroke-width="7" stroke-linecap="round"/>',
    'trend-down': '<path d="M10 90 H90" ' + n + '/><path d="M12 22 L38 48 L54 36 L84 70" ' + s + '/><path d="M66 72 H86 V52" fill="none" stroke="{W}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="22" r="8" fill="{L}" stroke="{I}" stroke-width="4"/>',
    # Engineering table of contents
    'loop': '<path d="M78 40 A30 30 0 0 0 22 34" ' + s + '/><path d="M22 60 A30 30 0 0 0 78 66" ' + s + '/><path d="M70 20 L80 42 L58 46" ' + s + '/><path d="M30 80 L20 58 L42 54" ' + s + '/><circle cx="50" cy="50" r="8" fill="{L}"/>',
    'lock': '<path d="M30 44 V30 C30 16 40 8 50 8 C60 8 70 16 70 30 V44" ' + s + '/><rect x="14" y="42" width="72" height="50" rx="12" fill="{I}"/><circle cx="50" cy="62" r="8" fill="{L}"/><path d="M50 66 V78" stroke="{L}" stroke-width="7" stroke-linecap="round"/>',
    'coin': '<ellipse cx="50" cy="70" rx="38" ry="16" fill="{N}"/><ellipse cx="50" cy="50" rx="38" ry="16" fill="{I}"/><ellipse cx="50" cy="30" rx="38" ry="16" fill="{L}" stroke="{I}" stroke-width="5"/>',
    'checklist': '<rect x="12" y="8" width="76" height="84" rx="12" fill="{I}"/><path d="M26 30 L32 36 L42 26 M26 54 L32 60 L42 50" fill="none" stroke="{L}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 31 H74 M52 55 H74 M26 76 H74" stroke="{H}" stroke-width="6" stroke-linecap="round"/>',
    'book': '<path d="M50 22 C38 12 20 12 8 16 V84 C20 80 38 80 50 90Z" fill="{I}"/><path d="M50 22 C62 12 80 12 92 16 V84 C80 80 62 80 50 90Z" fill="{N}"/><path d="M62 34 H80 M62 48 H76" stroke="{L}" stroke-width="6" stroke-linecap="round"/>',
    'wrench': '<path d="M60 10 C46 10 36 22 40 36 L10 66 C4 72 6 82 12 88 C18 94 28 96 34 90 L64 60 C78 64 90 54 90 40 L76 50 L62 46 L58 32 L70 18 C67 12 64 10 60 10Z" fill="{I}"/><circle cx="22" cy="78" r="6" fill="{L}"/>',
}

out = sys.argv[1]
for name, body in icons.items():
    for theme, p in pal.items():
        b = body
        for k, v in p.items():
            b = b.replace('{' + k + '}', v)
        file = name + ('-dark' if theme == 'dark' else '')
        with open(f'{out}/{file}.svg', 'w', encoding='utf-8') as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="48" height="48">{b}</svg>\n')
print(len(icons), 'icons')
