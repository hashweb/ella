FROM ubuntu:16.04

RUN apt-get update

# Node setup
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# Yarn Setup
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

RUN apt-get install -y htop nodejs yarn

# Create the "developer" user
RUN useradd -c "Developer account" developer
# Make developer a sudoer
RUN echo 'developer ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Change to the developer user and its home folder and run the entry point script
USER developer
WORKDIR /ella
