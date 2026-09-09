FROM node:16-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

COPY package*.json ./

# Force packages to compile fresh for Linux (Fixes Segfault 139)
RUN npm install --build-from-source
RUN npm rebuild sqlite3 canvas --build-from-source || true

COPY . .

EXPOSE 20054

CMD ["node", "--max-old-space-size=400", "index.js"]
