FROM node

# 使用淘宝 NPM 镜像（国内机器构建推荐启用）
# RUN npm config set registry https://registry.npm.taobao.org/

# Install PM2
RUN npm install pm2 -g

# npm install
ADD package.json /src/package.json
ADD package-lock.json /src/package-lock.json
WORKDIR /src
RUN npm i

# build
ADD . /src
RUN npm run build

# clean
RUN npm prune --production

# move
RUN rm -rf /app \
    && mv dist /app \
    && mv node_modules /app/ \
    && rm -rf /src

# ENV
ENV NODE_ENV production
# 运行的进程数量 max为最佳性能（进程数=CPU核心数）
ENV INSTANCE_NUM max

EXPOSE 3000

WORKDIR /app
CMD pm2-runtime index.js -i $INSTANCE_NUM