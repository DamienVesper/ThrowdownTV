import express from 'express';
import mongoose from 'mongoose';
import User from './models/User';
import fs from 'fs';

import cookieParser from 'cookie-parser';
import cookies from 'cookies';

import http from'http';
import https from 'https'

import glob from 'glob';

export class EmoteLoader {

	constructor(){
		this.emotesJson = {};
		this.emotesDir = {};
		fs.writeFileSync(`./config/emotes.json`, JSON.stringify({}, null, 4));
		this.emotesJson = JSON.parse(fs.readFileSync('./config/emotes.json').toString());
		setInterval(function(){
			this.emotesJson = JSON.parse(fs.readFileSync('./config/emotes.json').toString());
		}, 10 * 1000)

		let arrofEmotes = [];
		for(var prop in this.emotesJson){
			arrofEmotes.push(prop)
		}
		this.emotesArr = arrofEmotes
	}

	 async loadEmotes(){
		glob(__dirname + '/emotes/*.*', {absolute: false}, (error, files) => {
			if (files.length === 0) return console.log('[WARNING] Unable to locate any emotes.');
			files.forEach(async filePath => {
				let pathRegex = new RegExp(/\/{0}([A-z-/\d]){1,100}([^A-z.]){1}/g); // converts the whole url path to just image.extension
				let emoteName = filePath.replace(pathRegex, '').replace('.png', '').replace('.jpg', '').replace('.gif', '').replace(' ', '').toLowerCase();
				this.emotesJson[emoteName] = `/assets/img/emotes/${emoteName.toLowerCase()}`;
				this.emotesDir[emoteName] = filePath;
				await fs.writeFileSync(`./config/emotes.json`, JSON.stringify(this.emotesJson, null, 4));
				this.emotesArr.push(emoteName);
			})
			return JSON.parse(fs.readFileSync('./config/emotes.json').toString());
		})
	}
}




