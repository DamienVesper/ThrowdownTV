<div align="center">
    <h1>Throwdown.TV</h1>
    <p>A site built on free speech, for anyone, anywhere. Join a community where we bring together streamers into an unoppressed society where you can be completely transparent about anything and everything.</P>
</div>

## Prerequisites
To compile and execute this project, you will need:
 * Node.js v14+
 * Yarn
 * MongoDB
 * NGINX (optional, only if proxying is required)

## Developing
This project relies on [Yarn](https://yarnpkg.com/) to resolve dependencies, and thus, they must be installed in order for the server to run. Simply run `yarn install` in a terminal in the directory of the project. This is only necessary once when the repository is first cloned or when dependencies need updating.

To start a development server, run the following commands in a terminal in the directory of the project. A hot-reloading (ie: any changes you make will be reflected without needing to re-run the server) webfront will be located at `localhost:8080`:
```bash
yarn dev:server
```

## Package Managers
Please do not mix package managers! This project exclusively uses [Yarn](https://yarnpkg.com/).
