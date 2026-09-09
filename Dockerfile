FROM node:18-bookworm

WORKDIR /app

# SQLite development libraries install kar rahe hain taake source compilation mein masla na ho
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-noto-color-emoji \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Packages install karein
RUN npm install

# Asal Jaadu: better-sqlite3 ko forcibly container ke andar compile karo taake Segfault khatam ho
RUN npm rebuild better-sqlite3 --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054
ENV NODE_OPTIONS="--openssl-legacy-provider"

CMD ["node", "--max-old-space-size=1024", "index.js"]

