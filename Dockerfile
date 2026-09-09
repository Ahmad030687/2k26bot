FROM node:18-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

COPY package.json ./

# better-sqlite3 ko Linux ke mutabiq fresh build karega
RUN npm install
RUN npm rebuild better-sqlite3 --build-from-source

COPY . .

EXPOSE 20054

CMD ["node", "--max-old-space-size=400", "index.js"]
