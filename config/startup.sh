#!/bin/bash

# Install dependencies
sudo apt update
sudo apt-get install build-essential qt5-qmake qtdeclarative5-dev qt5-default qttools5-dev-tools libjack-jackd2-dev -y

# Download Jamulus
wget https://github.com/corrados/jamulus/archive/latest.tar.gz
tar -xvf latest.tar.gz

# Compile and install
cd jamulus-latest
qmake "CONFIG+=nosound headless" Jamulus.pro
make clean && make
sudo make install
sudo adduser --system --no-create-home jamulus

# TODO: Copy file from S3
sudo apt install awscli -y

sudo cp jamulus.service /etc/systemd/system/jamulus.service
sudo chmod 644 /etc/systemd/system/jamulus.service
sudo systemctl start jamulus
sudo systemctl enable jamulus

