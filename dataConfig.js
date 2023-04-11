const fs = require("fs");
const path = require("path");

module.exports = () => {
	var filePath = path.join(__dirname, "data", "groupList.json");
	var content = JSON.stringify([]);
	try {
		const file = fs.readFileSync(filePath);
		if (file) {
			fs.writeFileSync(filePath, content);
		}
	} catch (err) {
		fs.writeFileSync(filePath, content);
	}
	
	filePath = path.join(__dirname, "data", "groupId.json");
	content = [];
	for (let i=0; i<process.env.groupMaxCount; i++) {
		content.push(i);
	}
	content = JSON.stringify(content);
	try {
		const file = fs.readFileSync(filePath);
		if (file) {
			fs.writeFileSync(filePath, content);
		}
	} catch (err) {
		fs.writeFileSync(filePath, content);
	}
}