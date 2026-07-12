from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, send_file

BASE_DIR = Path(__file__).resolve().parent

APP_ID = "rack-and-run"
APP_NAME = "Rack & Run"
PORTAL_NAME = "ChapNet Pool"
TAGLINE = "THE TABLE IS YOURS"
CREATOR = "Brandon D. Chappell"
PORT = 5195

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)


@app.get("/")
def index():
    return render_template(
        "index.html",
        app_id=APP_ID,
        app_name=APP_NAME,
        portal_name=PORTAL_NAME,
        tagline=TAGLINE,
        creator=CREATOR,
    )


@app.get("/title-art")
def title_art():
    artwork = (
        BASE_DIR
        / "assets"
        / "images"
        / "rack-and-run-title-screen.png"
    )

    if not artwork.is_file():
        return jsonify(
            {
                "ok": False,
                "error": "Official title artwork is missing.",
            }
        ), 404

    return send_file(
        artwork,
        mimetype="image/png",
        conditional=True,
    )


@app.get("/api/health")
@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "app_id": APP_ID,
            "app_name": APP_NAME,
            "portal": PORTAL_NAME,
            "tagline": TAGLINE,
            "creator": CREATOR,
            "phase": "gameplay-table-foundation",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.get("/api/modes")
def modes():
    return jsonify(
        {
            "modes": [
                {
                    "id": "career",
                    "name": "Career Mode",
                    "status": "foundation",
                },
                {
                    "id": "quick-match",
                    "name": "Quick Match",
                    "status": "foundation",
                },
                {
                    "id": "practice",
                    "name": "Practice",
                    "status": "foundation",
                },
                {
                    "id": "tournament",
                    "name": "Tournament",
                    "status": "foundation",
                },
                {
                    "id": "trick-shot-lab",
                    "name": "Trick Shot Lab",
                    "status": "foundation",
                },
                {
                    "id": "multiplayer",
                    "name": "Multiplayer",
                    "status": "planned",
                },
            ]
        }
    )


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=PORT,
        debug=False,
        use_reloader=False,
    )
