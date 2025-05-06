From `https://github.com/jakobhoeg/nextjs-ollama-llm-ui`

Change `MODEL_NAME` in `.env`

- llama3.1:latest
- llama3.2-vision:latest
- llava:latest

1. Start Ollama
```
ollama serve
```
Check `http://localhost:3000/api/tags`
2. Start Docker Compose for Weaviate Server 
Check `http://localhost:8080/v1`

3. Check tools and RAG
`http://localhost:3000/api/chat/text`

4. Or Use web chat without tools and RAG
Check `http://localhost:3000`
