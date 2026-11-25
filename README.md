# BEETLE BRAWL — STANCE CRIMEA

Версия v0.1.14, самостоятельная статическая сборка для GitHub Pages. Игровая механика, графика и синтез звука сохранены.

## Запуск

```sh
python -m http.server 8000
```

Открыть http://localhost:8000/ . На GitHub: Settings → Pages → Deploy from a branch → main → / (root).

## Разработка

- `config.js` — баланс, предметы и аудионастройки.
- `engine.js` — симуляция.
- `game.js` — управление, Canvas, интерфейс.
- `audio.js` — согласованный синтез; `assets/audio/` — экспорт WAV.
- `assets/` — графика и ресурсы.
- `ENGINE-NOTES.md` — исторические технические заметки.

После изменения ресурсов или кода: `python build.py`. Тесты: `node --test tests/*.test.cjs`.

GitHub Pages не выполняет PHP. В этой сборке рекорды сохраняются локально в браузере; переход на основной сайт удалён. Общий рейтинг требует отдельного API. Лицензия проекта не назначена.
