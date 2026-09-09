FROM node:16-bullseye

WORKDIR /app

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

RUN npm install

# Asal Fix: Node 16 ke hisaab se better-sqlite3 ko fix kar rahe hain taake NAPI error na aaye
RUN npm install better-sqlite3@8.5.2 --save
RUN npm rebuild canvas better-sqlite3 --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]

