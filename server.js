var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var axios = require ("axios");
var PORT = 3000;


var app = express();



app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/newsscraper");
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

 mongoose.Promise = Promise;
 mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

var db = require("./models");


app.get("/scrape", function(req, res) {
  
  axios.get("http://www.nytimes.com/").then(function(response) {
    
    var $ = cheerio.load(response.data);

 var resultsArr = [];
    
    $(".theme-summary").each(function(i, element) {
     
      var result = {};

      result.title = $(this)
        .children(".story-heading")
        .text();
      result.link = $(this)
        .children(".story-heading")
        .children("a")
        .attr("href");

        console.log(result);

     

      db.Article.create(result)
        .then(function(dbArticle) {
         console.log(dbArticle);
        })
        .catch(function(err) {
          console.error(err);
          return res.json(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  console.log("Here");
  
  db.Article.find({})
    .then(function(dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});


app.get("/articles/:id", function(req, res) {
  
  db.Article.findOne({ _id: req.params.id })
    
    .populate("note")
    .then(function(dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});


app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id}, {note: dbNote._id}, {new: true });
    })
    .then(function(dbArticle) {
       res.json(dbArticle);
    })
    .catch(function(err) {
       res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});