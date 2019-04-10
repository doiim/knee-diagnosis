//
//	Run using command:  pm2 start index.js -e err.log --name predictit --log-date-format 'DD-MM HH:mm:ss'
//  mongod --dbpath D:/workspace/predictitParser/db
//
var express = require('express');
var app = express();
var helmet = require('helmet');
var swig = require('pug');
var fs = require('fs');
var util = require('util');
var schedule = require('node-schedule');
// var colors = require('colors');
var moment = require('moment');
var bodyParser = require('body-parser');
var promise = require('q');
var queue = require('queue');
var io = require('socket.io')(5001);

const { NlpClassifier } = require('node-nlp');
const classifier = new NlpClassifier({ language: 'pt' });

// INTERN SCRIPTS
var MongoUtils = require('./lib/mongo-utils');

// CONFIGURING EXPRESS TO SERVE
app.set('view cache', false);
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.listen(4001);

app.get('/tokens/', function (req, res) {
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var phrases=[];
		var classFilter = req.query.classFilter;
		if(classFilter==undefined)
			classFilter=1;
		var maxPhrases = req.query.maxPhrases;
		if(maxPhrases==undefined)
			maxPhrases=1;
		for(var i=0;i<diagnosis.length;i++)
		{
			var diag = diagnosis[i];
			diag.resultadoTxt.forEach(function(line){
				if(!classifier.getBestClassification(line) || classifier.getBestClassification(line).value < classFilter){
					phrases.push(line);
				}
			});
			if(phrases.length > maxPhrases){
				break;
			}
		}
		res.render('tokens',{phrases:phrases,tokens:settings.allTokens});
	});
});
app.get('/classify/', function(req, res) {
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var page = req.query.page;
		if(page==undefined)
			page=0;
		
		var classFilter = req.query.classFilter;
		if(classFilter==undefined)
			classFilter=1;

		var strFilter = req.query.strFilter;
		if(strFilter==undefined)
			strFilter="";
		var diagnosisPage=[];
		diagnosis.forEach(function(diag,idx){
			if(Math.floor( (idx)/10 ) == page){
				diag.result = [];
				diag.resultadoTxt.forEach(function(line){
					if(strFilter == "" || line.indexOf(strFilter) != -1){
						var phrase = line;
						line = {};
						line.phrase = phrase;
						line.tokens = [];
						var classifications = classifier.getClassifications(phrase);
						var sum=0;
						classifications.forEach(function(classification){
							if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
								sum+=classification.value;
							}
							line.tokens.push({label:classification.label,value:classification.value});
						});
						
						if(classifications[0].value < classFilter && sum < classFilter){
							diag.result.push(line)
						}

						line.maxValue = classifications[0].value;
						line.sum = sum;
					}
				});
				if(diag.result.length > 0)
					diagnosisPage.push(diag);
			}
		});
		res.render('classify',{diagnosis:diagnosisPage,tokens:settings.allTokens,page:page,totalPages:Math.ceil(diagnosis.length/10),strFilter:strFilter,classFilter:classFilter });
	});
	
});

app.get('/resume/', function(req, res) {
	var num = Number.parseInt(req.query.num);
	if(num==undefined)
		num=10;

	MongoUtils.getSomeDiagnosis(num)
	.then(function(diagnosis){
		var counters = {};
		counters.ok = 0;
		counters.med = 0;
		counters.bad = 0;
		counters.one = 0;
		counters.many = 0;
		counters.total = 0;
		diagnosis.forEach(function(diag,idx){
			diag.resultadoTxt.forEach(function(line){
				var classifications = classifier.getClassifications(line);
				var sum=0;
				classifications.forEach(function(classification){
					if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
						sum+=classification.value;
					}
				});
				counters.total++;
				
				if(classifications[0].value > 0.9){
					counters.one++;
					counters.ok++;
				}else if(classifications[0].value > 0.7){
					if(sum > 0.9){
						counters.many++;
						counters.ok++;
					}else{
						counters.one++;
						counters.med++;
					}
				}else{
					if(sum > 0.9){
						counters.many++;
						counters.ok++;
					}else if(sum > 0.7){
						counters.many++;
						counters.med++;
					}else{
						counters.one++;
						counters.bad++;
					}
				}
			});
		});
		res.render('resume',{counters:counters});
	});
	
});

io.on('connection', function(socket) {
	socket.on('removeToken', function(token) {
		settings.allTokens = settings.allTokens.filter(function(ele){
			return ele != token;
		});
		settings.nlpDictionary.phrases = settings.nlpDictionary.phrases.filter(function(ele,idx){
			return settings.nlpDictionary.tokens[idx] != token;
		});
		settings.nlpDictionary.tokens = settings.nlpDictionary.tokens.filter(function(ele){
			return ele != token;
		});
		saveSettings()
		.then(loadSettings)
		.then(initClassifier);
	});
	socket.on('addToken', function(token) {
		if(settings.allTokens.indexOf(token) == -1){
			settings.allTokens.push(token);
		}
		saveSettings()
		.then(loadSettings)
		.then(initClassifier);
	});

	socket.on('sendClassification', function(res) {
		res = JSON.parse(res);
		res.forEach(function(elem){
			if(settings.nlpDictionary.phrases.indexOf(elem.phrase) == -1){
				settings.nlpDictionary.phrases.push(elem.phrase);
				settings.nlpDictionary.tokens.push(elem.token);
			}
		});
		saveSettings()
		.then(loadSettings)
		.then(initClassifier);
	});
});

//SETTINGS THAT HOLDS INITIAL FILES AND STATUSES
var settings = {};

function loadSettings(){
	var deferred = promise.defer();
	try{
		settings = JSON.parse(fs.readFileSync("./data/settings.cfg"));
		console.log('Settings loaded successfully!');
		deferred.resolve(settings);
	} catch (err){
		settings = {};
		settings.nlpDictionary = {};
		settings.nlpDictionary.phrases = [];
		settings.nlpDictionary.tokens = [];
		console.error('Error opening settings file, reseting: '+err);
		deferred.resolve(settings);
	}

	return deferred.promise;
}
function saveSettings(){
	var deferred = promise.defer();
	fs.writeFile("./data/settings.cfg", JSON.stringify(settings, null, 2) , function(err) {
		if(err){ 
			console.error('Error saving settings file: ' + err);
			deferred.reject(err);
		}else{
			console.log('Settings saved successfully!');
			deferred.resolve();
		}
	});

	return deferred.promise;
}


var diagnosis = [];
var count=0;
function SaveAllDiagnosis(){
	console.log("Init Saving all diagnosis");
	var lineReader = require('readline').createInterface({
		input: fs.createReadStream('./data/rm_joelho.txt')
	});
	
	lineReader.on('line', function (line) {
		count++;
		console.log("Reading line - "+count);
		if(count!=1)
			diagnosis.push(line.split('\t'));
	});

	lineReader.on('close', function () {
		var q = queue();
		q.timeout = 100;
		q.concurrency = 1;
		console.log("Finished reading diagnosis.")

		// For each market opened
		diagnosis.forEach(function(diag,i){
			q.push(function(cb) {
				MongoUtils.SaveDiagnosis(diag)
				.then(function(diag){
					console.log("Saved diagnosis."+i);
					cb();
				});
			});
		});
		q.start(function(err) {
			console.log('Finished saving diagnosis!'.green);
		});
	});
}

function PrintDiagnosisOnFile(){
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var result='';
		diagnosis.forEach(function(diag){
			diag.resultadoTxt.forEach(function(line){
				result += line+'\n';
			});
			result += '\n\n*********************************************************\n\n'
		});
		fs.writeFile("./data/allDiags.txt", result , function(err) {
			if(err) return console.error('Error saving diagnosis file: ' + err);
		});
	});
}

function initClassifier(settings){
	var deferred = promise.defer();
	console.log("Init classifier with settings phrases");
	settings.nlpDictionary.phrases.forEach(function(phrase,idx){
		classifier.add(phrase, settings.nlpDictionary.tokens[idx]);
	});
	classifier.train()
	.then(function(){
		console.log("Trained classifier");
		deferred.resolve();
	});    
	return deferred.promise;
}

function generatingTokens(){
	var deferred = promise.defer();
	var q = queue();
	q.timeout = 100;
	q.concurrency = 1;

	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		console.log("Starting generating token list");
		diagnosis.forEach(function(diag,idx){
			q.push(function(cb) {
				var tokenList = [];
				diag.resultadoTxt.forEach(function(line){
					var lineTokens=[];
					var classifications = classifier.getClassifications(line);
					classifications.forEach(function(classification){
						if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
							lineTokens.push(classification.label);
						}
					});
					tokenList.push(lineTokens);
				});
				MongoUtils.UpdateTokenList(diag,tokenList)
				.then(function(diag){
					console.log("Done diag: "+idx);
					cb();
				});
			});
		});
		q.start(function(err) {
			console.log('Finished updating diagnosis token list!');
			deferred.resolve();
		});
		
	});

	return deferred.promise;
}

function resetingTokens(){
	var deferred = promise.defer();
	var q = queue();
	q.timeout = 100;
	q.concurrency = 1;

	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		console.log("Starting reseting token list");
		diagnosis.forEach(function(diag,idx){
			q.push(function(cb) {
				MongoUtils.UpdateTokenList(diag,null)
				.then(function(diag){
					console.log("Done "+idx);
					cb();
				});
			});
		});
		q.start(function(err) {
			console.log('Finished reseting diagnosis token list!');
			deferred.resolve();
		});
		
	});

	return deferred.promise;
}

function buildSymptonResultList(){
	var deferred = promise.defer();

	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var diagnosisList=[];
		console.log("Starting looking for diagnosis attribute");
		diagnosis.forEach(function(diag,idx){
			var startDiag=false;
			diag.tokenList.forEach(function(lineTokens){
				var ind = lineTokens.indexOf("diagnostico");
				if(ind != -1 && lineTokens.length < 7){
					lineTokens.splice(ind,1);
					startDiag=true;
				}
				if(startDiag && lineTokens.length > 0 && lineTokens.length < 7){
					if(diagnosisList.indexOf(lineTokens) == -1)
						diagnosisList.push(lineTokens);
				}
			});		
		});
		var q = queue();
		q.timeout = 100;
		q.concurrency = 1;
		console.log("Starting building symptomList and resultList");
		diagnosis.forEach(function(diag,idx){
			q.push(function(cb) {
				console.log("Diagnostico: "+diag._id);
				diag.symptomList = [];
				diag.resultList = [];
				diag.tokenList.forEach(function(lineTokens){
					if(diagnosisList.indexOf(lineTokens) == -1){
						if(lineTokens.length > 0 && lineTokens.length < 7)
							diag.symptomList.push(lineTokens);
					}else{
						diag.resultList.push(lineTokens);
					}				
				});		
				MongoUtils.UpdateDiagnosis(diag)
				.then(function(res){
					cb();
				});
			});		
		});		
		q.start(function(err) {
			console.log('Finished building symptomList and resultList');
			deferred.resolve();
		});
	});

	return deferred.promise;
}

loadSettings();
// .then(initClassifier)
// .then(function(){
// 	setTimeout(buildSymptonResultList,1000);
// });
// .then(SaveAllDiagnosis);
