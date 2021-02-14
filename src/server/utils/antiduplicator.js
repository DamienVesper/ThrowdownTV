let mongoose = require("mongoose")
let User = require("../models/user.model")

let runStreamKeys = async function () {
	let bulkOp = await User.collection.initializeOrderedBulkOp();
	
	var count = 0
	
	function makeid(length) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
		   result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	 }
	
	 // Literally bugged rn - Does not work
	 let result = await User.aggregate([
		{$group:{"_id":"$settings.streamKey","streamKey":{$first:"$settings.streamKey"},"count":{$sum:1}}},
		{$match:{"count":{$gt:1}}},
		{$project:{"streamKey":1,"_id":0}},
		{$group:{"_id":null,"duplicateKeys":{$push:"$settings.streamKey"}}},
		{$project:{"_id":0,"duplicateKeys":1}}
		]);	
		if(!result ||! result[0]) return console.log("No Duplicates (Stream Keys)!")
		console.log(result[0])
		let duplicateChatKeys = result[0].duplicateKeys

	if(!duplicateChatKeys[0]) return console.log("No Duplicates (stream keys)")
	console.log("Duplicate Keys: " + duplicateChatKeys)
	
	 duplicateChatKeys.forEach(async key => {
		 let result = await User.find({"settings.streamKey": key})
			result.forEach(async (userObj) => {
				console.log("settings stream key for user " + userObj.username)
				(userObj).settings.streamKey = makeid(32);
				(userObj).save()
			})
		})
	console.log("Fixed duplicates!")
	 
	}

	module.exports.fixAllDuplicates = async function fixAllDuplicates(){
		await runStreamKeys();
	}
	