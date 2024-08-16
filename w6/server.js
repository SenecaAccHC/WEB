/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Aaron Herrlich Canhadi Student ID: 151342227 Date: 14 August 2024
*
********************************************************************************/
const legoData = require("./modules/legoSets");
const authData = require('./modules/auth-service');
const path = require('path'); 
const express = require('express');
const clientSessions = require('client-sessions');
const app = express();
require("pg");
const Sequelize = require("sequelize");

const HTTP_PORT = process.env.PORT || 6008;

app.use(clientSessions({
    cookieName: 'session',
    secret: "web322_ss6_ajksdjkasbdbajs1232424",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.render("home"));

app.get('/about', (req, res) => res.render("about"));

app.get("/lego/sets", async (req, res) => {
    try {
        const sets = req.query.theme ? await legoData.getSetsByTheme(req.query.theme) : await legoData.getAllSets();
        res.render("sets", { sets });
    } catch (err) {
        res.status(404).render("404", { message: "Sorry, we couldn't retrieve the requested LEGO sets." });
    }
});

app.get("/lego/sets/:num", async (req, res) => {
    try {
        const set = await legoData.getSetByNum(req.params.num);
        res.render("set", { set });
    } catch (err) {
        res.status(404).render("404", { message: "Sorry, the requested set could not be found." });
    }
});

app.get("/lego/addSet", ensureLogin, async (req, res) => {
    try {
        const themes = await legoData.getAllThemes();
        res.render("addSet", { themes });
    } catch (err) {
        res.status(500).render("500", { message: "Unable to load the add set page. Please try again later." });
    }
});

app.post("/lego/addSet", ensureLogin, async (req, res) => {
    try {
        await legoData.addSet(req.body);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: "Failed to add the LEGO set. Please try again." });
    }
});

app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
    try {
        const [set, themes] = await Promise.all([
            legoData.getSetByNum(req.params.num),
            legoData.getAllThemes()
        ]);
        res.render("editSet", { set, themes });
    } catch (err) {
        res.status(404).render("404", { message: "The set you're trying to edit could not be found." });
    }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
    try {
        await legoData.editSet(req.body.set_num, req.body);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: "Failed to update the set. Please try again." });
    }
});

app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
    try {
        await legoData.deleteSet(req.params.num);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: "Unable to delete the set at this time." });
    }
});

app.get("/login", (req, res) => res.render("login", { errorMessage: "", username: "" }));

app.post("/login", async (req, res) => {
    try {
        const user = await authData.checkUser({ ...req.body, userAgent: req.get('User-Agent') });
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        };
        res.redirect('/lego/sets');
    } catch (err) {
        res.render("login", { errorMessage: "Login failed. Please check your credentials.", username: req.body.userName });
    }
});

app.get("/register", (req, res) => res.render("register", { errorMessage: "", successMessage: "", username: "" }));

app.post("/register", async (req, res) => {
    try {
        await authData.registerUser(req.body);
        res.render("register", { errorMessage: "", successMessage: "User created successfully.", username: "" });
    } catch (err) {
        res.render("register", { errorMessage: "Registration failed. Please try again.", successMessage: "", username: req.body.userName });
    }
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get("/userHistory", ensureLogin, (req, res) => res.render("userHistory"));

app.use((req, res) => {
    res.status(404).render("404", { message: "Sorry, we couldn't find what you were looking for." });
});

legoData.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => console.log(`Server listening on port ${HTTP_PORT}`));
    })
    .catch(err => {
        console.error("Failed to start the server:", err);
    });