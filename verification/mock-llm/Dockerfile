FROM node:24-alpine
WORKDIR /app
COPY server.mjs ./
ENV MOCK_LLM_PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
