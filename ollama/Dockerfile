FROM ollama/ollama:latest

# Start Ollama daemon temporarily in the background to pull the model during image build
RUN (ollama serve &) && \
    sleep 5 && \
    ollama pull qwen2.5-coder:7b-instruct-q3_K_M && \
    pkill ollama

EXPOSE 11434

ENTRYPOINT ["ollama", "serve"]
