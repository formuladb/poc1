First PoC of data-driven formuladb low-code platform. **abandoned**


# Febe

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.4.3.

## 1. Development

### 1.1 Setting up CouchDB and test data

Install docker toolbox: https://docs.docker.com/toolbox/toolbox_install_windows/
The run the following commands from Git Bash:

```bash
VBoxManage controlvm "docker1" natpf1 "couchdb,tcp,,5984,,5984"
docker run -d --name cdb -p 5984:5984 couchdb
curl -X PUT http://127.0.0.1:5984/_users
curl -X PUT http://127.0.0.1:5984/_replicator
curl -X PUT http://127.0.0.1:5984/_global_changes
curl -X PUT http://127.0.0.1:5984/mwzhistory
curl -X PUT http://127.0.0.1:5984/mwztransactions

npm install -g add-cors-to-couchdb
add-cors-to-couchdb
```

Then load test data:

```bash
./node_modules/.bin/tsc # compile the test data loader
node dist/out-tsc/src/app/test/mocks/loadTestData.js
```

```bash
curl -X DELETE http://127.0.0.1:5984/mwzhistory
curl -X PUT http://127.0.0.1:5984/mwzhistory
node dist/out-tsc/src/app/test/mocks/loadTestData.js 2>&1 | tee log
grep -i error log
```

### 1.2 Running 

```bash
# start angular app
./node_modules/.bin/ng serve --proxy-config proxy.config.json
# start backend
cd server && npm run serve
```

#### traffic shaping (IGNORE, NOT WORKING)

```bash
docker-machine.exe create docker1
eval $(docker-machine.exe env docker1 --shell bash)
cd docker
docker build -t mycouchdb .
MSYS_NO_PATHCONV=1 docker run --privileged -d --name cdb -p 5984:5984 mycouchdb


IGNORE NETWORK SHAPING FOR NOW...it does not work
docker exec -it cdb tc qdisc change dev eth0 root netem delay 150ms
RTNETLINK answers: No such file or directory... WTF!!!! ignore for now, but we should really test with high latency and low throughput network links, developing and testing at loopback network speed is asking for trouble !!!!

/wondershaper.sh -a eth0 -d 256 -u 256 #also does not work WTF
# we should use trickle for user-space traffic shaping
```

### Other usual commands

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

Run `ng test -w` to execute the unit tests via [Karma](https://karma-runner.github.io).

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

# 2. Production

TODO

