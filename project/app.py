"""
AI IT Help Desk Assistant - Flask Backend
-------------------------------------------
This server does two things:
1. Serves the chat web page (templates/index.html + static/ files).
2. Exposes a /chat API route that takes the user's message, sends it to
   Google Gemini along with an IT-support "system prompt", and returns
   the AI's troubleshooting reply as JSON.

Run with:  python app.py
"""

import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

# ---------------------------------------------------------------------------
# 1. Load configuration from the .env file (keeps the API key out of code)
# ---------------------------------------------------------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    # We don't crash the app immediately - we let it start so the UI still
    # loads, but every /chat call will return a clear configuration error.
    print("WARNING: GEMINI_API_KEY is not set. Add it to your .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# The Gemini model used for generating responses.
MODEL_NAME = "gemini-2.5-flash"

# ---------------------------------------------------------------------------
# 2. The "persona" system prompt - this is what makes Gemini behave like a
#    senior IT Help Desk engineer instead of a generic chatbot.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """
You are an experienced IT Help Desk Support Engineer with over 10 years of
experience in desktop support, networking, system administration, and
troubleshooting. You work at a corporate IT Service Desk.

Your job is to help users resolve common IT issues by providing clear,
professional, step-by-step troubleshooting guidance.

You support the following categories:
- Password Reset Assistance
- Printer Troubleshooting
- Wi-Fi Troubleshooting
- Windows Update Issues
- Blue Screen (BSOD) Troubleshooting
- Software Installation and Configuration
- Email Issues (Outlook, Gmail, Exchange)
- VPN Connectivity Problems
- Slow Computer Performance
- Network Drive Access Issues
- Application Crashes
- Hardware Diagnostics

When a user describes a problem:
1. If key details are missing, ask 1-3 short diagnostic questions first.
2. Identify the most likely root causes.
3. Give troubleshooting steps ordered from basic to advanced.
4. Explain any technical term in plain, simple language.
5. Suggest preventive measures so the issue is less likely to recur.
6. Tell the user when and why to escalate to Level-2 / an IT Administrator.

Always format your answer using this structure, with these exact headings:

Issue Summary:
[One or two sentence description of the problem]

Possible Causes:
- Cause 1
- Cause 2
- Cause 3

Troubleshooting Steps:
Step 1: ...
Step 2: ...
Step 3: ...

Expected Result:
[What should happen if the steps work]

Prevention Tips:
- Tip 1
- Tip 2

Escalation:
[When and why to contact IT Administrator / Level-2 support]

Keep a professional, calm, corporate help-desk tone at all times. Be
concise but complete. If the user's message is just a greeting or is not
an IT issue, respond naturally and invite them to describe their problem,
without forcing the full template onto small talk.
"""

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the chat interface."""
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """
    Receive a user message + optional short chat history, call Gemini with
    the IT help-desk persona, and return the assistant's reply as JSON.

    Expected JSON body:
    {
        "message": "My printer is not printing",
        "history": [
            {"role": "user", "text": "..."},
            {"role": "assistant", "text": "..."}
        ]
    }
    """
    if not GEMINI_API_KEY:
        return jsonify({
            "error": "Server is missing GEMINI_API_KEY. "
                     "Add it to the .env file and restart the server."
        }), 500

    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not user_message:
        return jsonify({"error": "message field is required"}), 400

    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=SYSTEM_PROMPT,
        )

        # Rebuild the conversation so Gemini has context of earlier turns.
        gemini_history = []
        for turn in history[-10:]:  # keep the last 10 turns for context
            role = "model" if turn.get("role") == "assistant" else "user"
            gemini_history.append({
                "role": role,
                "parts": [turn.get("text", "")],
            })

        chat_session = model.start_chat(history=gemini_history)
        response = chat_session.send_message(user_message)
        reply_text = response.text

        return jsonify({"reply": reply_text})

    except Exception as exc:  # noqa: BLE001 - surface a friendly error to the UI
        return jsonify({
            "error": f"Something went wrong talking to the AI service: {exc}"
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
