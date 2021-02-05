const express = require(`express`);
const mongoose = require(`mongoose`);
const User = require(`./models/user.model`);
const fs = require(`fs`);

const cookieParser = require(`cookie-parser`);
const cookies = require(`cookies`);

const http = require(`http`);
const https = require(`https`);

const glob = require(`glob`);

class EmoteLoader {
    constructor () {
        this.emotesJson = {};
        this.emotesDir = {};
        fs.writeFileSync(`./config/emotes.json`, JSON.stringify({}, null, 4));
        this.emotesJson = JSON.parse(fs.readFileSync(`./config/emotes.json`).toString());
        setInterval(function () {
            this.emotesJson = JSON.parse(fs.readFileSync(`./config/emotes.json`).toString());
        }, 10 * 1000);

        const arrofEmotes = [];
        for (const prop in this.emotesJson) {
            arrofEmotes.push(prop);
        }
        this.emotesArr = arrofEmotes;
    }

    async loadEmotes () {
        // eslint-disable-next-line node/no-path-concat
        glob(`${__dirname}/emotes/*.*`, { absolute: false }, (_error, files) => {
            if (files.length === 0) return console.log(`[WARNING] Unable to locate any emotes.`);
            files.forEach(async filePath => {
                // eslint-disable-next-line prefer-regex-literals
                const pathRegex = new RegExp(/\/{0}([A-z-/\d]){1,100}([^A-z.]){1}/g); // converts the whole url path to just image.extension
                const emoteName = filePath.replace(pathRegex, ``).replace(`.png`, ``).replace(`.jpg`, ``).replace(`.gif`, ``).replace(` `, ``).toLowerCase();
                this.emotesJson[emoteName] = `/assets/img/emotes/${emoteName.toLowerCase()}`;
                this.emotesDir[emoteName] = filePath;
                await fs.writeFileSync(`./config/emotes.json`, JSON.stringify(this.emotesJson, null, 4));
                this.emotesArr.push(emoteName);
            });
            return JSON.parse(fs.readFileSync(`./config/emotes.json`).toString());
        });
    }
}

module.exports.EmoteLoader = EmoteLoader;
