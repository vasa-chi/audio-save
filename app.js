/**
 * Created by vasa on 15.01.14.
 */

"use strict";

var express = require('express'),
  path = require('path'),
  fs = require('fs'),
  glob = require('glob');

var app = express();

app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart({keepExtensions : true, uploadDir : path.join(__dirname, 'static', 'uploads')}));
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'static')));
app.use(app.router);

app.get('/records', function (req, res) {
  glob("*.wav", {cwd : path.join(__dirname, 'static', 'uploads')}, function (err, files) {
    var result = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      result.push('uploads/' + file);
    }
    res.send({records : result})
  })
});

app.post('/records', function (req, res) {
  fs.rename(req.files.record.path, req.files.record.path + '.wav', function (err) {
    if (err) {return res.send(err, 500)}
    res.send({path : path.relative(path.join(__dirname, 'static'), req.files.record.path + '.wav')})
  });
});

app.listen(9000, function () {
  console.log("app is listening on port 9000")
});