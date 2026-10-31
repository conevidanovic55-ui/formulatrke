"""Browser checks for the static site. Remote GitHub and video frames are intercepted."""
import base64
import json
import os
import pathlib
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
seed = json.loads((ROOT / 'tests/fixtures/demo-catalog.json').read_text())
remote = {'catalog': seed, 'sha': 'seed-sha', 'published': False}
server = subprocess.Popen(['node', 'scripts/server.mjs', '--dist'], cwd=ROOT, env={**os.environ, 'PORT': '3001'}, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for attempt in range(50):
        try:
            urllib.request.urlopen('http://127.0.0.1:3001/content.json', timeout=1).close()
            break
        except Exception:
            if server.poll() is not None:
                raise RuntimeError('Test server failed to start')
            time.sleep(.1)
    else:
        raise RuntimeError('Test server timed out')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
        context.route('**/content.json', lambda route: route.fulfill(json=seed))
        context.route('https://ok.ru/**', lambda route: route.fulfill(body='<p>Intercepted provider frame for browser test</p>', content_type='text/html'))
        def github(route):
            assert route.request.headers.get('authorization') == 'Bearer browser-test-token'
            if route.request.method == 'GET':
                route.fulfill(json={'sha': remote['sha'], 'content': base64.b64encode(json.dumps(remote['catalog']).encode()).decode()})
            else:
                body = route.request.post_data_json
                assert body['sha'] == remote['sha']
                assert body['branch'] == 'main'
                decoded = base64.b64decode(body['content']).decode()
                assert 'browser-test-token' not in decoded
                remote.update(catalog=json.loads(decoded), sha='updated-sha', published=True)
                route.fulfill(json={'content': {'sha': remote['sha']}})
        context.route('https://api.github.com/**', github)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:3001/')
        page.locator('.race-card').first.wait_for()
        assert page.locator('.race-card').count() == 6
        assert page.locator('#load-error').is_hidden(), 'Do not display an archive error alongside loaded races'
        assert page.locator('.social-link').count() == 3
        assert page.locator('.hero-bottom .arrow-down').count() == 0
        assert page.locator('.card-category').count() == 0
        assert page.locator('.card-duration').count() == 0
        assert page.locator('.card-kind').count() == page.locator('.race-card').count()
        assert abs(page.locator('.ticker > div').bounding_box()['x'] + page.locator('.ticker > div').bounding_box()['width'] / 2 - 720) < 4
        # Hero picture and coordinates come from the same JSON entry.
        hero = page.locator('.hero[data-track-image]')
        hero.wait_for(timeout=30000)
        track_list = json.loads((ROOT / 'public/staze.json').read_text())['tracks']
        first_image = hero.get_attribute('data-track-image')
        first_track = next(t for t in track_list if t['image'] == first_image)
        assert page.locator('#hero-track-name').inner_text() == first_track['name']
        assert page.locator('#hero-track-coordinates').inner_text() == first_track['coordinates']
        page.reload()
        hero.wait_for(timeout=30000)
        next_image = hero.get_attribute('data-track-image')
        assert next_image != first_image, 'Hero track should change on consecutive loads'
        next_track = next(t for t in track_list if t['image'] == next_image)
        assert page.locator('#hero-track-name').inner_text() == next_track['name']
        assert page.locator('#hero-track-coordinates').inner_text() == next_track['coordinates']
        assert page.locator('.hero-caption').is_visible()
        # The archive must still work if the separate hero photo catalog is unavailable.
        fallback_page = context.new_page()
        fallback_page.route('**/staze.json', lambda route: route.abort())
        fallback_page.goto('http://127.0.0.1:3001/')
        assert fallback_page.locator('.hero-caption').is_hidden()
        assert fallback_page.locator('#hero-track-name').inner_text() == ''
        assert fallback_page.evaluate("getComputedStyle(document.querySelector('.hero'), '::before').backgroundImage") == 'none'
        fallback_page.locator('.race-card').first.wait_for()
        fallback_page.close()
        assert page.locator('.site-header nav a').all_text_contents() == ['Početna']
        assert page.locator('.site-header .brand-logo').bounding_box()['width'] >= 320
        assert page.get_by_role('link', name='Istraži arhivu').is_visible()
        page.get_by_role('link', name='Privatnost').click()
        privacy = page.locator('#privacy-dialog')
        assert privacy.is_visible()
        assert 'GitHub' not in privacy.inner_text()
        assert 'društvenih' not in privacy.inner_text().lower()
        assert 'video' in privacy.inner_text().lower()
        page.keyboard.press('Escape')
        assert privacy.is_hidden()
        page.screenshot(path=str(OUT / 'desktop.png'), full_page=True)
        page.get_by_role('button', name='Sezona 2025').click()
        assert page.locator('.race-card').count() == 2
        page.locator('#search').fill('Belgi')
        assert page.locator('.race-card').count() == 1
        page.locator('#kind').select_option('Trka')
        assert page.locator('#empty-state').is_visible()
        page.locator('#empty-reset').click()
        assert page.locator('.race-card').count() == 9
        page.locator('.race-card').first.click()
        assert page.get_by_text('Ovo je probni unos.', exact=False).is_visible()
        page.keyboard.press('Escape')
        page.locator('#player-dialog').wait_for(state='hidden')
        for width in [375, 390, 768]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}'
            assert abs(page.locator('.ticker > div').bounding_box()['x'] + page.locator('.ticker > div').bounding_box()['width'] / 2 - width / 2) < 4
            assert page.locator('.site-header .brand-logo').bounding_box()['width'] >= 165
            assert page.get_by_role('link', name='Početna').is_visible()
            if width == 390:
                page.get_by_role('button', name='Sezona 2026').click()
                page.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
        page.goto('http://127.0.0.1:3001/urednik.html')
        page.locator('.editor-race-row').first.wait_for()
        assert page.locator('input[type=file]').count() == 1  # JSON import only, no video uploads.
        page.locator('#save').click()
        page.get_by_text('Za objavljivanje prvo poveži GitHub nalog iznad.', exact=False).wait_for()
        page.locator('#password').fill('browser-test-token')
        page.locator('#login-form button').click()
        page.get_by_text('Nalog je povezan.', exact=False).wait_for()
        page.locator('#new-season').fill('2027')
        page.locator('#add-season').click()
        page.locator('#race-title').fill('Provera OK.ru linka')
        page.locator('#race-location').fill('Test staza')
        page.locator('#race-image').fill('Kina.png')
        page.locator('#video-link').fill('https://ok.ru/video/11719629212384')
        page.locator('#preview-video').click()
        preview = page.locator('#editor-preview iframe')
        assert preview.get_attribute('src') == 'https://ok.ru/videoembed/11719629212384'
        assert 'allow-top-navigation' not in preview.get_attribute('sandbox')
        page.locator('#rights').check()
        page.locator('#add-race').click()
        page.get_by_text('Link je sačuvan u nacrtu.', exact=False).wait_for()
        assert not remote['published']
        page.reload()
        page.get_by_text('Vraćen je lokalni nacrt koji nije objavljen.', exact=True).wait_for()
        assert page.locator('.editor-race-row').filter(has_text='Provera OK.ru linka').count() == 1
        assert page.evaluate('!JSON.stringify(localStorage).includes("browser-test-token")')
        with page.expect_download() as download_info:
            page.locator('#export').click()
        download = download_info.value
        draft = json.loads(pathlib.Path(download.path()).read_text())
        assert draft['races'][-1]['videoUrl'] == 'https://ok.ru/video/11719629212384'
        # Reconnect and import the saved draft before publishing.
        page.on('dialog', lambda dialog: dialog.accept())
        page.locator('#password').fill('browser-test-token')
        page.locator('#login-form button').click()
        page.get_by_text('Nalog je povezan.', exact=False).wait_for()
        page.locator('#import').set_input_files({'name': 'content.json', 'mimeType': 'application/json', 'buffer': json.dumps(draft).encode()})
        page.get_by_text('Nacrt je učitan. Još nije javno objavljen.', exact=True).wait_for()
        page.locator('#save').click()
        page.get_by_text('Izmene su sačuvane na GitHub-u.', exact=False).wait_for()
        assert remote['published']
        page.screenshot(path=str(OUT / 'editor.png'), full_page=True)
        # Simulate the artifact after deployment, not a live GitHub Pages publication.
        page.route('**/content.json', lambda route: route.fulfill(json=remote['catalog']))
        page.goto('http://127.0.0.1:3001/')
        page.get_by_role('button', name='Sezona 2027').wait_for()
        assert page.locator('.race-card').count() == 1
        page.locator('.race-card').click()
        assert page.locator('#player-body iframe').get_attribute('src') == 'https://ok.ru/videoembed/11719629212384'
        assert page.locator('.player-source-link').get_attribute('href') == 'https://ok.ru/video/11719629212384'
        page.keyboard.press('Escape')
        page.locator('#player-body iframe').wait_for(state='detached')
        # Unknown providers open via a safe external link instead of arbitrary iframes.
        alternate = json.loads(json.dumps(remote['catalog']))
        alternate['races'][-1]['videoUrl'] = 'https://example.com/watch/123'
        page.unroute('**/content.json')
        page.route('**/content.json', lambda route: route.fulfill(json=alternate))
        page.reload()
        page.locator('.race-card').first.wait_for()
        page.locator('.race-card').first.click()
        assert page.locator('#player-body iframe').count() == 0
        assert page.get_by_role('link', name='Otvori snimak', exact=True).get_attribute('href') == 'https://example.com/watch/123'
        # GitHub project subpath must preserve all relative assets and catalog requests.
        page.unroute('**/content.json')
        def project_path(route):
            if route.request.url.endswith('/content.json'):
                route.fulfill(json=seed)
                return
            response = route.fetch(url=route.request.url.replace('/Web-sajt/', '/'))
            route.fulfill(response=response)
        context.route('**/Web-sajt/**', project_path)
        page.goto('http://127.0.0.1:3001/Web-sajt/')
        page.locator('.race-card').first.wait_for()
        assert page.locator('.race-card').count() == 6
        # Finally verify the actual public catalog without test fixture interception.
        context.unroute('**/content.json')
        live_catalog = json.loads((ROOT / 'public/content.json').read_text())
        playable = [race for race in live_catalog['races'] if race.get('videoUrl')]
        newest_playable_season = next(
            (season for season in live_catalog['seasons'] if any(r['season'] == season for r in playable)),
            live_catalog['seasons'][0]
        )
        page.goto('http://127.0.0.1:3001/')
        page.locator('.race-card').first.wait_for()
        assert page.locator('.race-card').count() == len([r for r in live_catalog['races'] if r['season'] == newest_playable_season])
        assert page.locator('.circuit').count() == 0
        assert page.locator('.card-image').count() == len([r for r in live_catalog['races'] if r['season'] == newest_playable_season and r.get('image')])
        assert page.get_by_role('button', name=f'Sezona {newest_playable_season}').get_attribute('aria-pressed') == 'true'
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.screenshot(path=str(OUT / 'desktop.png'), full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
        assert not errors, errors
        browser.close()
    print('PASS: static site, mobile layouts, project subpath, filters, OK.ru embed normalization and sandbox, external fallback, draft persistence/import/export, and mocked GitHub publication. No JS errors. Live provider playback and public deployment are not tested here.')
finally:
    server.terminate()
    server.wait(timeout=10)
