FROM node:18-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3

COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3 --update-binary || true

COPY . .

EXPOSE 20054

CMD ["npm", "start"]
