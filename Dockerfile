FROM node:18-bookworm

WORKDIR /app

# 1. Zaroori libraries install karein
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
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# 2. Packages install karein (Node 18 par prebuilds smoothly lag jayenge)
RUN npm install

COPY . .

EXPOSE 20054
ENV PORT=20054

# 3. YAHAN HAI ASAL JAADU: Yeh flag fca-priyansh ke login crash (Segfault) ko hamesha ke liye rok degi!
ENV NODE_OPTIONS="--openssl-legacy-provider"

CMD ["node", "--max-old-space-size=1024", "index.js"]

