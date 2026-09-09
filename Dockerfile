FROM node:18-bookworm

WORKDIR /app

# Native C++ binaries aur SQLite headers install karein
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

# Packages install karne ke baad better-sqlite3 aur canvas ko source se compile karein
RUN npm install
RUN npm rebuild better-sqlite3 canvas --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]

