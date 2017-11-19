FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install curl sudo -y

# Node setup
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -

# Yarn Setup
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update
RUN apt-get install -y htop nodejs yarn

# Create the "developer" user
RUN useradd -m -c "Developer account" developer
# Make developer a sudoer
RUN echo 'developer ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Set development environment
ENV NODE_ENV development

# For Google Chrome Node debugging
EXPOSE 9229

# Change to the developer user and its home folder and run the entry point script
USER developer
WORKDIR /ella
