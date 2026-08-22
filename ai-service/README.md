# EnterpriseAI AI Service

## Local setup

Install and start Ollama, then download the model used by the service:

```bash
ollama pull qwen3:0.6b
ollama serve
```

Create the Python environment and start the API on macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
