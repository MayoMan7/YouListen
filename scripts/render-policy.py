from pathlib import Path
import html
import re
root = Path(__file__).resolve().parent.parent
source = (root / 'PRIVACY.md').read_text(encoding='utf-8')
parts = []
in_list = False
for paragraph in source.strip().split('\n\n'):
    text = html.escape(paragraph)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    if text.startswith('# '): parts.append('<h1>' + text[2:] + '</h1>')
    elif text.startswith('## '): parts.append('<h2>' + text[3:] + '</h2>')
    elif text.startswith('- '): parts.append('<ul>' + ''.join('<li>'+line[2:]+'</li>' for line in text.splitlines()) + '</ul>')
    else: parts.append('<p>' + text + '</p>')
page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>YouListen Privacy Policy</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#203328;background:#f8faf7}h1{font-size:34px;line-height:1.2;letter-spacing:-1px}h2{font-size:21px;margin-top:32px}code{font-size:.9em}li{margin:8px 0}p{margin:16px 0}</style></head><body><main>' + '\n'.join(parts) + '</main></body></html>\n'
(root / 'docs/privacy.html').write_text(page,encoding='utf-8',newline='\n')
print('Rendered docs/privacy.html from PRIVACY.md')
