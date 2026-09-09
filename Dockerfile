FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# 1. Zaroori libraries aur naya OS (GLIBC 2.35)
RUN apt-get update && apt-get install -y \
    wget \
    xz-utils \
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

# 2. Node.js 16 install kar rahe hain taake FCA crash na ho
RUN wget https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.xz \
    && tar -xJf node-v16.20.2-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v16.20.2-linux-x64.tar.xz

WORKDIR /app

COPY package*.json ./

# 3. Packages install karein
RUN npm install

COPY . .

EXPOSE 20054
ENV PORT=20054

CMD ["node", "--max-old-space-size=1024", "index.js"]

