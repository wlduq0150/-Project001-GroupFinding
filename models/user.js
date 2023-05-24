const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			tag: {
				type: Sequelize.STRING(150),
				allowNull: false,
			},
			nick: {
				type: Sequelize.STRING(20),
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING(50),
				allowNull: false,
				unique: true,
			},
			password: {
				type: Sequelize.STRING(200),
				allowNull: false,
			},
		}, {
			sequelize,
			timestamps: true,
			underscored: false,
			modelName: "User",
			tableName: "users",
			paranoid: true,
			charset: "utf8",
			collate: "utf8_general_ci",
		});
	}
	
	static associate(db) {
		
	}
}