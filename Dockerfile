FROM node:16-bullseye

WORKDIR /app

RUN apt-get -o Acquire::Check-Valid-Until=false update && apt-get install -y --no-install-recommends \
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

# Pehle normal install karega
RUN npm install

# YAHAN FIX HAI: Is command se wo GLIBC 2.33 wali file hata kar aapke OS ke hisaab se nayi file banayega
RUN npm rebuild better-sqlite3 sqlite3 canvas ws --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]
