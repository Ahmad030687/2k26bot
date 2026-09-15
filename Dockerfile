FROM node:16-bullseye

WORKDIR /app

# Cache clean karke update fix-missing ke sath run kar rahe hain taake 404 error na aaye
RUN apt-get clean && apt-get update --fix-missing && apt-get install -y --no-install-recommends \
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

# Node 16 ke hisaab se stable SQLite aur missing modules
RUN npm install better-sqlite3@8.7.0 image-downloader pastebin-api --save
RUN npm install

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]
