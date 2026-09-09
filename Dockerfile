FROM node:16-bullseye

WORKDIR /app

# Sab zaroori system files aur dependencies (Canvas, SQLite ke liye)
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

# Sab kuch fresh compile karna
RUN npm install --build-from-source

COPY . .

EXPOSE 20054
ENV PORT=20054

# Memory limit ko thora badha diya hai taake FB login easily ho jaye
CMD ["node", "--max-old-space-size=1024", "index.js"]

