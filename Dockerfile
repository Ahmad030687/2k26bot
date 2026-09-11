FROM node:16-bullseye

WORKDIR /app

# Purane Debian archive ka expired release error bypass karne ke liye flag add kar diya hai
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

# Node 16 ke liye stable sqlite version
RUN npm install better-sqlite3@8.7.0 --save
RUN npm install

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]
