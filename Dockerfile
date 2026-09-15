# Base image ko Node 18 par update kar diya gaya hai
FROM node:18-bullseye

WORKDIR /app

# Updated image hone ki wajah se ab packages smoothly install ho jayenge
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

# Dependencies installation
RUN npm install better-sqlite3@8.7.0 image-downloader pastebin-api --save
RUN npm install

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]

