"""Build a runtime-only ZIP for local Chrome installation. Python standard library only."""
from pathlib import Path
import hashlib
import json
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parent.parent
RUNTIME = [
    'manifest.json', 'background.js', 'settings.js', 'tracking-core.js',
    'stats-history.js', 'playback.js', 'content.js', 'hide-video.css',
    'popup.html', 'popup.css', 'popup.js', 'LICENSE', 'PRIVACY.md',
    'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png',
]

def png_size(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG signature'
    return struct.unpack('>II', data[16:24])

def validate():
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    assert manifest['manifest_version'] == 3
    assert len(manifest['description']) <= 132
    assert re.fullmatch(r'\d+\.\d+\.\d+(?:\.\d+)?', manifest['version'])
    assert set(manifest['permissions']) == {'storage', 'alarms'}
    refs = [manifest['background']['service_worker'], manifest['action']['default_popup']]
    refs += list(manifest['icons'].values()) + list(manifest['action']['default_icon'].values())
    for script in manifest['content_scripts']:
        assert script['matches'] == ['https://www.youtube.com/*']
        refs += script.get('js', []) + script.get('css', [])
    html = (ROOT / 'popup.html').read_text(encoding='utf-8')
    refs += re.findall(r'(?:src|href)="([^"#]+)"', html)
    for ref in refs:
        assert ref in RUNTIME, f'Unpackaged runtime reference: {ref}'
    for item in RUNTIME:
        content = (ROOT / item).read_bytes()
        assert content, f'Empty file: {item}'
        if item.endswith('.png'):
            size = int(Path(item).stem.split('-')[-1])
            assert png_size(content) == (size, size)
        else:
            text = content.decode('utf-8')
            assert '\ufffd' not in text and '\u00c3' not in text and '\u00e2\u20ac' not in text, f'Text corruption: {item}'
    return manifest

if __name__ == '__main__':
    manifest = validate()
    destination = ROOT / 'dist'
    destination.mkdir(exist_ok=True)
    archive = destination / f"youlisten-{manifest['version']}.zip"
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as out:
        for name in sorted(RUNTIME):
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            out.writestr(info, (ROOT / name).read_bytes())
    with zipfile.ZipFile(archive) as built:
        assert set(built.namelist()) == set(RUNTIME)
        assert built.testzip() is None
        assert json.loads(built.read('manifest.json'))['version'] == manifest['version']
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (destination / (archive.name + '.sha256')).write_text(f'{digest}  {archive.name}\n', encoding='ascii')
    print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'files': len(RUNTIME), 'sha256': digest}, indent=2))
