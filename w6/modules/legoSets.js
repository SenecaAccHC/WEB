/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Aaron Herrlich Canhadi Student ID: 151342227 Date: 26 July 2024
*
********************************************************************************/
// Part 2: Writing legoSets.js
const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "postgres",
    dialectModule: require('pg'),
    port: 5432,
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false,
        },
    },
});

// Define Theme model
const Theme = sequelize.define('Theme', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: Sequelize.STRING
}, {
    timestamps: false
});

// Define Set model
const Set = sequelize.define('Set', {
    set_num: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING
}, {
    timestamps: false
});

// Define association between Set and Theme
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// Initialize Sequelize and sync with the database
function initialize() {
    return sequelize.sync();
}

// Retrieve all sets with associated themes
function getAllSets() {
    return Set.findAll({ include: [Theme] });
}

// Retrieve a set by its set_num
function getSetByNum(setNum) {
    return Set.findOne({
        where: { set_num: setNum },
        include: [Theme]
    }).then(set => {
        if (set) {
            return set;
        } else {
            throw new Error("Set not found");
        }
    });
}

// Retrieve sets by a specific theme
function getSetsByTheme(theme) {
    return Set.findAll({
        include: [Theme],
        where: {
            '$Theme.name$': {
                [Sequelize.Op.iLike]: `%${theme}%`
            }
        }
    }).then(sets => {
        if (sets.length > 0) {
            return sets;
        } else {
            throw new Error("No sets found for the given theme");
        }
    });
}

// Add a new set
function addSet(setData) {
    return Set.create({
        set_num: setData.set_num,
        name: setData.name,
        year: setData.year,
        num_parts: setData.num_parts,
        img_url: setData.img_url,
        theme_id: setData.theme_id
    }).then(() => {
        // No need to return anything on success
    }).catch((err) => {
        // Extracting the first error message
        const errorMessage = err.errors ? err.errors[0].message : "Unknown error occurred";
        throw new Error(errorMessage);
    });
}

// Edit an existing set
function editSet(set_num, setData) {
    return Set.update(setData, {
        where: { set_num: set_num }
    }).then(() => {
        // No need to return anything on success
    }).catch((err) => {
        // Extracting the first error message
        const errorMessage = err.errors ? err.errors[0].message : "Unknown error occurred";
        throw new Error(errorMessage);
    });
}

// Delete a set by its set_num
function deleteSet(set_num) {
    return Set.destroy({
        where: { set_num: set_num }
    }).then(() => {
        // No need to return anything on success
    }).catch((err) => {
        // Extracting the first error message
        const errorMessage = err.errors ? err.errors[0].message : "Unknown error occurred";
        throw new Error(errorMessage);
    });
}

// Retrieve all themes
function getAllThemes() {
    return Theme.findAll().then(themes => {
        return themes;
    });
}

// Exporting functions to be used in server.js
module.exports = {
    initialize,
    getAllSets,
    getSetByNum,
    getSetsByTheme,
    addSet,
    editSet,
    deleteSet,
    getAllThemes
};
