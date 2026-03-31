const { Client } = require("pg")

const client = new Client({
    user: "eddiereinhardt",
    host: "localhost",
    database: "nhl",
    password: "",
    port: 5432, //port for postgreSQL
})

client.connect()
.then(() => console.log("Connected to DB"))

module.exports = client