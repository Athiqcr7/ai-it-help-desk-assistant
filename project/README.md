# AI IT Help Desk Assistant

A full-stack web app that acts as a Level-1 IT Help Desk engineer. Users
describe a computer problem in a ChatGPT-style chat window, and a Flask
backend forwards the message to **Google Gemini** using a system prompt
that makes the AI ask diagnostic questions, list possible causes, walk
through troubleshooting steps, give prevention tips, and recommend
escalation when needed.

## Features

- Modern, corporate IT Service Desk styled chat UI
- Dark mode (with light mode toggle)
- Typing indicator while the AI is "thinking"
- Chat history saved in the browser (persists on refresh)
- Copy-to-clipboard button on every AI response
- Timestamp on every message
- Sidebar with 12 IT categories, each pre-filled with a sample prompt
- Clear chat / new ticket button
- Fully responsive (desktop, tablet, mobile)

## Supported categories

1. Password Reset Assistance
2. Printer Troubleshooting
3. Wi-Fi Troubleshooting
4. Windows Update Issues
5. Blue Screen (BSOD) Troubleshooting
6. Software Installation and Configuration
7. Email Issues (Outlook, Gmail, Exchange)
8. VPN Connectivity Problems
9. Slow Computer Performance
10. Network Drive Access Issues
11. Application Crashes
12. Hardware Diagnostics

## Folder structure

```
project/
│
├── app.py                 # Flask backend + Gemini integration
├── requirements.txt       # Python dependencies
├── .env                   # Your Gemini API key (not committed to git)
│
├── templates/
│   └── index.html         # Chat page
│
├── static/
│   ├── style.css           # Dark-mode corporate UI styling
│   └── script.js            # Chat logic (sending, history, typing, copy, theme)
│
└── README.md               # This file
```

## Prerequisites

- Python 3.9 or newer
- A free Google Gemini API key: https://aistudio.google.com/app/apikey

## Installation

1. **Unzip / open the project folder** and move into it:
   ```bash
   cd project
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv

   # Activate it:
   # macOS / Linux:
   source venv/bin/activate
   # Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Add your Gemini API key.** Open the `.env` file and replace the
   placeholder:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running the project

```bash
python app.py
```

You should see output similar to:

```
 * Running on http://0.0.0.0:5000
```

Open your browser at **http://localhost:5000** — the chat interface will load.

## requirements.txt contents

```
Flask==3.0.3
python-dotenv==1.0.1
google-generativeai==0.8.3
```

## Sample prompts and expected responses

**User:** "My laptop won't connect to Wi-Fi."

**Assistant (example response):**
```
Issue Summary:
The laptop is unable to establish a Wi-Fi connection.

Possible Causes:
- Wi-Fi is turned off or the wrong network is selected
- Router or modem needs a restart
- Saved network profile has an outdated password
- Driver or hardware issue with the wireless adapter

Troubleshooting Steps:
Step 1: Confirm Wi-Fi is switched on and the correct network name (SSID) is selected.
Step 2: Restart the router and modem, waiting 30 seconds before powering back on.
Step 3: Forget the network on the laptop and reconnect, entering the password fresh.
Step 4: Update or reinstall the wireless network adapter driver if the issue persists.

Expected Result:
The laptop reconnects to Wi-Fi and can browse the internet normally.

Prevention Tips:
- Keep network drivers updated
- Restart the router periodically to avoid connection drift

Escalation:
If other devices also can't connect, or the adapter isn't detected at all,
escalate to Level-2 support to check the router/ISP or replace the hardware.
```

**User:** "My PC crashed with a blue screen showing MEMORY_MANAGEMENT."

**Assistant (example response):** follows the same Issue Summary /
Possible Causes / Troubleshooting Steps / Expected Result / Prevention
Tips / Escalation format, tailored to BSOD diagnostics (checking recent
driver changes, running Windows Memory Diagnostic, checking disk health,
and escalating to Level-2 if the crash repeats in Safe Mode).

## Notes for beginners

- All AI behavior (the "persona" and response format) lives in the
  `SYSTEM_PROMPT` variable inside `app.py`. Edit it there to change tone,
  add categories, or change the response format.
- Chat history is stored in the browser's `localStorage`, not a database
  — clearing browser data will also clear the chat.
- Never commit your real `.env` file (with a real API key) to a public
  GitHub repository.

## License

Free to use and modify for learning, coursework, or internal company projects.
