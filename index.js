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
var io = require('socket.io')(process.argv[3].split('=')[1]);

const { NlpClassifier } = require('node-nlp');
const classifier = new NlpClassifier({ language: 'pt' });

// INTERN SCRIPTS
var MongoUtils = require('./lib/mongo-utils');
var TensorFlowUtils =  require('./lib/tensorflow-utils');

// CONFIGURING EXPRESS TO SERVE
app.set('view cache', false);
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.listen(process.argv[2].split('=')[1]);

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
						
						line.maxValue = classifications[0].value;
						line.sum = sum;

						if(classifications[0].value < classFilter && sum < classFilter){
							diag.result.push(line)
						}
					}
				});
				if(diag.result.length > 0)
					diagnosisPage.push(diag);
			}
		});
		res.render('classify',{diagnosis:diagnosisPage,tokens:settings.allTokens,page:page,totalPages:Math.ceil(diagnosis.length/10),strFilter:strFilter,classFilter:classFilter });
	});
	
});
app.get('/lowclassify/', function(req, res) {
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var diagnosisPage=[];
		diagnosis.forEach(function(diag,idx){
			console.log("checking diag "+idx);
			if(diagnosisPage.length > 100){
				return;
			}
			diag.result = [];
			diag.resultadoTxt.forEach(function(line){
				if(line.match(/[A-Za-z]/i) == null){
					console.log("Empty phrase");
					return;
				}
				var phrase = line;
				line = {};
				line.phrase = phrase;
				line.tokens = [];
				var classifications = classifier.getClassifications(phrase);
				var sum=0;
				var hasMeta=false;
				classifications.forEach(function(classification){
					if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
						sum+=classification.value;
						line.tokens.push({label:classification.label,value:classification.value});
						if(classification.label == "meta" || classification.label == "diagnostico")
							hasMeta=true;
					}
				});
				line.maxValue = classifications[0].value;
				line.sum = sum;

				if(hasMeta && line.tokens.length > 1){
					diag.result.push(line);
				}				
			});
			if(diag.result.length > 0){
				diagnosisPage.push(diag);
			}
		});
		res.render('lowclassify',{diagnosis:diagnosisPage,tokens:settings.allTokens });
	});
	
});
app.get('/print/', function(req, res) {
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var diagnosisPage=[];
		var printStr="";
		diagnosis.forEach(function(diag,idx){
			console.log("Checking diag "+idx);
			printStr +="DIAGNOSIS "+idx+"\n";
			printStr += "\tSymptoms:"+"\n";
			diag.symptomList.forEach(function(line){
				printStr +="\t\t"+ line+"\n";
			});
			printStr += "\tResults:"+"\n";
			diag.resultList.forEach(function(line){
				printStr +="\t\t"+ line+"\n";
			});
			// diag.result = [];
			// diag.resultadoTxt.forEach(function(line){
			// 	var phrase = line;
			// 	line = {};
			// 	line.phrase = phrase;
			// 	line.tokens = [];
			// 	var classifications = classifier.getClassifications(phrase);
			// 	var sum=0;
			// 	var hasMeta=false;
			// 	classifications.forEach(function(classification){
			// 		if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
			// 			sum+=classification.value;
			// 			line.tokens.push({label:classification.label,value:classification.value});
			// 			if(classification.label == "meta" || classification.label == "diagnostico")
			// 				hasMeta=true;
			// 		}
			// 	});
			// 	if(hasMeta && line.tokens.length == 1){
			// 		printStr += line.phrase+"\n";
			// 		line.tokens.forEach(function(tok,i){
			// 			printStr += tok.label+" ";
			// 		});
			// 		printStr +="\n";
			// 	}
			// });
		});
		fs.writeFile("./data/allDiags.txt", printStr , function(err) {
			if(err) return console.error('Error saving diagnosis file: ' + err);
		});
		res.render('print',{ });
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
		counters.nItens = 0;
		counters.total = 0;
		diagnosis.forEach(function(diag,idx){
			diag.resultadoTxt.forEach(function(line){
				var classifications = classifier.getClassifications(line);
				var sum=0;
				var numItens=0;
				classifications.forEach(function(classification){
					if( (classifications[0].value - classification.value)/classifications[0].value < 0.2){
						sum+=classification.value;
						numItens++;
					}
				});
				counters.total++;
				if(numItens > 20){
					counters.nItens++;
				}
				
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
app.get('/predict/', function(req, res) {
	var id = req.query.id;
	if(id==undefined)
		id="";
	var rawData = [];
	MongoUtils.getValidDiagnosis(id)
	.then(function(diag){
		var symptomList = diag.symptomList;
		var resultList = diag.resultList;
		
		if(symptomList != null && symptomList.length > 0 && resultList != null && resultList.length > 0){
			rawData.push({symptomList:symptomList,resultList:resultList});
		}
		var toks = TensorFlowUtils.predict(rawData,settings);
		
		var esperadoF =[];
		diag.tokenList.forEach(function(tokens,i){
			if(tokens.indexOf("meta") != -1)
				tokens.splice(tokens.indexOf("meta"),1);
			if(tokens.indexOf("diagnostico") != -1)
				tokens.splice(tokens.indexOf("diagnostico"),1);
			if(tokens.indexOf("titulo") != -1)
				tokens.splice(tokens.indexOf("titulo"),1);
		});

		rawData[0].resultList.forEach(function(res){
			var idx = -1;
			diag.tokenList.forEach(function(tokens,i){
				var found = true;
				if(tokens.length != res.length){
					found = false;
					return;
				}
				tokens.forEach(function(tok,j){
					if(tok != res[j])
						found = false;
				});
				if(found){
					idx = i;
				}
			});
			if(idx != -1)
				esperadoF.push( diag.resultadoTxt[ idx ]  );
			else{
				console.log("ERROR FINDING RESULT ON TOKEN LIST");
			}
		});
		findPhrase(toks)
		.then(function(phrases){
			var length = phrases.length;
			rawData[0].resultList.splice(length,rawData[0].resultList.length - length);
			esperadoF.splice(length,esperadoF.length - length);

			res.render('predict',{esperadoF:esperadoF,esperadoT:rawData[0].resultList,resultadoF:phrases,resultadoT:toks});
		});

		
	});
	
});
app.get('/predictfromfile/', function(req, res) {
	var strToPredict="";
	try{
		strToPredict = fs.readFileSync("./data/predict.txt").toString();
	} catch (err){
		console.log(err);
		return;
	}
	var resultadoTxt = strToPredict.split('\n');
    resultadoTxt = resultadoTxt.filter(function(line){
        return !(!line || line.length == 0 || line.match(/[A-Za-z]/i) == null)
	});

	var rawData = [];
	generateTokens(resultadoTxt)
	.then(buildSRList)
	.then(function(diag){
		var symptomList = diag.symptomList;
		var resultList = diag.resultList;
		
		if(symptomList != null && symptomList.length > 0 && resultList != null && resultList.length > 0){
			rawData.push({symptomList:symptomList,resultList:resultList});
		}
		var toks = TensorFlowUtils.predict(rawData,settings);
		var esperadoF =[];
		diag.tokenList.forEach(function(tokens,i){
			if(tokens.indexOf("meta") != -1)
				tokens.splice(tokens.indexOf("meta"),1);
			if(tokens.indexOf("diagnostico") != -1)
				tokens.splice(tokens.indexOf("diagnostico"),1);
			if(tokens.indexOf("titulo") != -1)
				tokens.splice(tokens.indexOf("titulo"),1);
		});

		rawData[0].resultList.forEach(function(res){
			var idx = -1;
			diag.tokenList.forEach(function(tokens,i){
				var found = true;
				if(tokens.length != res.length){
					found = false;
					return;
				}
				tokens.forEach(function(tok,j){
					if(tok != res[j])
						found = false;
				});
				if(found){
					idx = i;
				}
			});
			if(idx != -1)
				esperadoF.push( diag.resultadoTxt[ idx ]  );
			else{
				console.log("ERROR FINDING RESULT ON TOKEN LIST");
			}
		});
		findPhrase(toks)
		.then(function(phrases){
			var length = phrases.length;
			rawData[0].resultList.splice(length,rawData[0].resultList.length - length);
			esperadoF.splice(length,esperadoF.length - length);

			res.render('predict',{esperadoF:esperadoF,esperadoT:rawData[0].resultList,resultadoF:phrases,resultadoT:toks});
		});
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
			diag.resultadoTxt.forEach(function(line,idx){
				result += line+'\n';
				result += diag.tokenList+'\n';
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
				var vtokenList=[];
				diag.resultadoTxt.forEach(function(line){
					var lineTokens=[];
					var sum=0;
					var classifications = classifier.getClassifications(line);
					classifications.forEach(function(classification){
						if( (classifications[0].value - classification.value)/classifications[0].value < 0.4){
							lineTokens.push(classification.label);
							sum +=classification.value;
						}
					});
					vtokenList.push(sum);
					tokenList.push(lineTokens);
				});
				MongoUtils.UpdateTokenList(diag,tokenList,vtokenList)
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

function generateTokens(resultadoTxt){
	var deferred = promise.defer();
	
	var tokenList = [];
	var vtokenList=[];
	resultadoTxt.forEach(function(line){
		var lineTokens=[];
		var sum=0;
		var classifications = classifier.getClassifications(line);
		classifications.forEach(function(classification){
			if( (classifications[0].value - classification.value)/classifications[0].value < 0.4){
				lineTokens.push(classification.label);
				sum +=classification.value;
			}
		});
		vtokenList.push(sum);
		tokenList.push(lineTokens);
	});
	var res = {};
	res.resultadoTxt = resultadoTxt;
	res.vtokenList = vtokenList;
	res.tokenList = tokenList;
	deferred.resolve(res);

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
				MongoUtils.ResetingSRList(diag,null)
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
			console.log("Diagnostico: "+idx);
			var startDiag=false;
			var tokenList = [];
			diag.tokenList.forEach(function(lineTokens,idxLine){
				tokenList.push({tokens:lineTokens,val:diag.vtokenList[idxLine]});
			});
			tokenList.sort(function(a,b){
				if(a.val > b.val) return -1;
				else if(a.val < b.val) return 1;
				else return 0;
			});

			tokenList.forEach(function(item){
				var tokens = [];
				item.tokens.forEach(function(tok){
					if(tok == "diagnostico"){
						startDiag=true;
					}else if(tok != "meta"){
						tokens.push(tok);
					}
				});
				
				if(startDiag && tokens.length > 0){
					if(!hasList(diagnosisList,tokens))
						diagnosisList.push(tokens);
				}
			});		
		});
		var q = queue();
		q.timeout = 100;
		q.concurrency = 1;
		
		console.log("Starting building symptomList and resultList");
		diagnosis.forEach(function(diag,idx){
			q.push(function(cb) {
				console.log("Diagnostico: "+idx);
				diag.symptomList = [];
				diag.resultList = [];
				diag.tokenList.forEach(function(lineTokens){
					var tokens = [];
					lineTokens.forEach(function(tok){
						if(tok != "diagnostico" && tok != "meta"){
							tokens.push(tok);
						}
					});
					
					if(!hasOnlyAuxTokens(tokens)){
						
						if(hasList(diagnosisList,tokens)){
							diag.resultList.push(tokens);
							diag.symptomList.push(tokens);
						}else{
							diag.symptomList.push(tokens);
						}		
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

function buildSRList(diagP){
	var deferred = promise.defer();

	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var diagnosisList=[];
		console.log("Starting looking for diagnosis attribute");
		diagnosis.forEach(function(diag,idx){
			console.log("Diagnostico: "+idx);
			var startDiag=false;
			var tokenList = [];
			diag.tokenList.forEach(function(lineTokens,idxLine){
				tokenList.push({tokens:lineTokens,val:diag.vtokenList[idxLine]});
			});
			tokenList.sort(function(a,b){
				if(a.val > b.val) return -1;
				else if(a.val < b.val) return 1;
				else return 0;
			});

			tokenList.forEach(function(item){
				var tokens = [];
				item.tokens.forEach(function(tok){
					if(tok == "diagnostico"){
						startDiag=true;
					}else if(tok != "meta"){
						tokens.push(tok);
					}
				});
				
				if(startDiag && tokens.length > 0){
					if(!hasList(diagnosisList,tokens))
						diagnosisList.push(tokens);
				}
			});		
		});
		
		diagP.symptomList = [];
		diagP.resultList = [];
		diagP.tokenList.forEach(function(lineTokens){
			var tokens = [];
			lineTokens.forEach(function(tok){
				if(tok != "diagnostico" && tok != "meta"){
					tokens.push(tok);
				}
			});
			
			if(!hasOnlyAuxTokens(tokens)){
				
				if(hasList(diagnosisList,tokens)){
					diagP.resultList.push(tokens);
					diagP.symptomList.push(tokens);
				}else{
					diagP.symptomList.push(tokens);
				}		
			}		
		});	
		deferred.resolve(diagP);
	});

	return deferred.promise;
}

function hasOnlyAuxTokens(line){
	var res=true;
	line.forEach(function(token){
		if(settings.auxTokens.indexOf(token) == -1){
			res=false;
		}
	});
	return res;
}

function hasList(bigList,list){
	for(var i=0;i< bigList.length;i++){

		var itemList = bigList[i];
		if(itemList.length != list.length) continue;

		var same=true;
		for(var j=0;j<list.length;j++){
			if(itemList.indexOf(list[j]) == -1){
				same=false;
				break;
			}
		}
		if(same) 
			return true;
	}
	return false;
}

function callTensorFlow(){
	var rawData = [];
	var maxS=0,maxR=0,maxLS=0,maxLR=0;
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		diagnosis.forEach(function(diag,idx){
			var symptomList = diag.symptomList;
			var resultList = diag.resultList;
			
			if(symptomList != null && symptomList.length > 0 && resultList != null && resultList.length > 0){
				rawData.push({symptomList:symptomList,resultList:resultList});
			}
		});
		console.log("Finished building rawData for tensorflow");
	
		TensorFlowUtils.InitTensorFlow(rawData,settings);
	});
}

function findPhrase(predictions){
	console.log("Started find similarity phrase");
	var deferred = promise.defer();
	var pValues=[];
	var phrases=[];
	predictions.forEach(function(ele,i){
		pValues.push(0);
		var str="";
		predictions[i] = ele.filter(function(item){
			if(item.label != "meta"){
				str+=item.label+" ";
				return true;
			}
			return false;
		});
		phrases.push(str);
	});

	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var finished=false;
		for(var i=0;i < diagnosis.length;i++){

			for(var j=0;j < diagnosis[i].tokenList.length;j++){

				for(var k=0;k < predictions.length;k++){
					
					if(pValues[k] < predictions[k].length*2){
						finished=false;
						var similarity = calculateSimilarity(predictions[k],diagnosis[i].tokenList[j]);
						if(similarity > pValues[k]){
							pValues[k] = similarity;
							phrases[k] = diagnosis[i].resultadoTxt[j];
						}
					}
				}
				if(finished)
					break;
			}
			if(finished)
				break;
		}
		console.log("Finished find similarity phrase");
		deferred.resolve(phrases);
	});
	return deferred.promise;
}

function calculateSimilarity(predictions,tokens){
	var calc=0;
	if(predictions.length == 0)
		return -1;
	predictions.forEach(function(pred,idx){
		var ind = tokens.indexOf(pred.label);
		if(ind != -1){
			calc+=1.0;
			if(ind == idx){
				calc+=1.0;
			}
		}
	});
	calc -= Math.abs(predictions.length - tokens.length)*0.5;
	return calc;
}

loadSettings()

// .then(SaveAllDiagnosis);

// .then(initClassifier)
// .then(function(){
// 	 setTimeout(generatingTokens,2000);
// });

.then(initClassifier)

// .then(buildSymptonResultList);

.then(callTensorFlow)
.then(function(){
	console.log("GO AHEAD: Gol de Cabeça!");
});

// .then(resetingTokens);



