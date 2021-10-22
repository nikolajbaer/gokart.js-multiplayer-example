FROM node:lts-buster

RUN apt-get update && apt-get install -y build-essential cmake openssl