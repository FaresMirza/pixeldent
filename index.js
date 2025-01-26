const express = require("express");
const serverless = require("serverless-http");

const app = express();
app.use(express.json()); // Parse JSON bodies

app.get("pixeldent/admin",(req,res)=>{
    res.send("Hello")
})


module.exports.handler = serverless(app);