FROM debian:bullseye
ENV PATH="/usr/local/go/bin:/jscontract/workspaces/type-explorer/bin:$PATH" 
RUN apt-get update && apt-get upgrade
RUN apt-get install -y curl jq gcc make wget git
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y nodejs
RUN wget https://dl.google.com/go/go1.17.7.linux-amd64.tar.gz
RUN tar -zxvf go1.17.7.linux-amd64.tar.gz -C /usr/local/
RUN mkdir jscontract
COPY . /jscontract
RUN npm install --prefix /jscontract
RUN cd /jscontract/workspaces/type-explorer/statistics && make && cd .. && statistics 2>&1 | tee -a output.log
CMD [ "/bin/bash" ]
