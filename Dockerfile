FROM node:18-slim

# System dependencies for Canvas & SQLite
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Cache bypass aur clean install
RUN npm install --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=512", "index.js"]
