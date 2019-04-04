var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
mongoose.connect('mongodb://localhost:4002/diagnosis', { server: { poolSize: 5 } });
var Diagnosis = require('../models/diagnosis-schema');
var moment = require('moment');
// var colors = require('colors');
// var fs = require('fs');
// var util = require('util');
var queue = require('queue');
var promise = require('q');
var cheerio = require('cheerio');
const { NlpClassifier } = require('node-nlp');
const classifier = new NlpClassifier({ language: 'pt' });
const readlineSync = require('readline-sync');

var err = {
    code: 0,
    message: ''
};

var count = 0;

module.exports = {

    // Save sweeped contract from PredictIt site
    SaveDiagnosis: function( diagnosis){
        var deferred = promise.defer();
        var resultTxt = parseHtml(diagnosis[13]);
    
        Classify(resultTxt)
        .then(function(classifications){
            console.log(classifications);
            var diag = new Diagnosis({
                Marca: diagnosis[0],	
                idUnidade: diagnosis[1],
                Unidade: diagnosis[2],
                dataExame: parseDate(diagnosis[3]),	
                numAtendimento:	diagnosis[4],
                idProntuario: diagnosis[5],
                Idade: diagnosis[6],
                Sexo: diagnosis[7],
                idEspecialidade: diagnosis[8],
                Especialidade: diagnosis[9],
                idExame: diagnosis[10],
                Exame: diagnosis[11],
                dataLaudo: parseDate(diagnosis[12]),
                resultadoTxt: classifications.phrases,
                resultadoHtml: diagnosis[13],
                tokenList: classifications.tokens,
                symptomList: null,
                resultList: null
            });
            
            diag.save(function (err, diag) {
                if (err){
                    console.log(err);
                }
                deferred.resolve(diag);
            });
        });
        

        return deferred.promise;
    },

    // Get markets with highest volume from database
    getAllDiagnosis: function(){
        var deferred = promise.defer();
        console.log('Getting all diagnosis');
        Diagnosis.find({})
        .exec()
        .then(function(diagnosis){
            console.log('Got all diagnosis');
            deferred.resolve(diagnosis);
        })
        .catch(function(err){
            deferred.reject('Error returning diagnosis. ' + err);
        });

        return deferred.promise;
    }

    // getMarketMatches: function(marketID){

	// 	var deferred = promise.defer();

	// 	MatchedOrder.find({ sportBetsID: marketID }).exec(function(err, matcheds) {
	// 		if (err){
	// 			deferred.reject(err)
	// 			return deferred.promise;
	// 		}
	// 		deferred.resolve(matcheds);
	// 	});

	// 	return deferred.promise;
	// },

    // // Update market closing dates based on existence of it
	// updateDates: function(){
	// 	var deferred = promise.defer();

	// 	PredictIt.where('sportBetsID').exists(true).find({opened:true}).exec(function (err,markets){
	// 		var q = queue();
	// 		q.timeout = 1000;
	// 		q.concurrency = 1;

	// 		// For each market opened
	// 		markets.forEach(function(market, mI){
	// 			q.push(function(cb) {
	// 				if (market.closDate != null){
	// 					sportBets.change_time(market.sportBetsID, market.closDate, market.settlDate, function(sportBetsId){
	// 						console.log(market.externalID + ' closing time updated!'.green);
	// 						cb();
	// 					});
	// 				} else {
	// 					var closDate = 	moment().add(2,'weeks');
	// 					var settlDate = moment().add(2,'weeks').add(2,'hours');
	// 					sportBets.change_time(market.sportBetsID, closDate, settlDate, function(sportBetsId){
	// 						console.log(market.externalID + ' closing time delayed!'.green);
	// 						cb();
	// 					});
	// 				}
	// 			});

	// 		});

	// 		console.log('--------====== UPDATING CLOSING DATES! ======-------- Total:'.yellow + q.length);
	// 		q.start(function(err) {
	// 		  console.log('Finished updating closing dates!'.green);
	// 		  deferred.resolve();
	// 		});
	// 	});

	// 	return deferred.promise;
	// },

    // // Update market with a new sportBets ID
    // updateMarketID: function(market, sportBetsID){
    //     PredictIt.findOneAndUpdate({_id:market._id},{sportBetsID:sportBetsID}).exec(function(err,doc){
    //         if (!err) console.log(market.externalID + "MARKET CREATED SUCCESSFULLY!".green.inverse)
    //     });
    // },


}

function convert_tick_to_datetime(ticks){
	ticks = ticks - 621355968000000000;
	var miliseconds = ticks/10000;
	var date = new Date(miliseconds);
	return date;
}


function parseDate(sDate){
    var monthsDic = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateSplited = sDate.split(' ');
    var hourSplited = dateSplited[3].split(':');
    
    return new Date(dateSplited[5],
                    monthsDic.indexOf(dateSplited[1]),
                    dateSplited[2],
                    hourSplited[0],
                    hourSplited[1],
                    hourSplited[2],
                0);
}

function parseHtml(diagnosisStr){

    var txtData = '';	
    var cheerioObj = cheerio.load(diagnosisStr);
    cheerioObj('span').each(function(i, elem) {
        var str = (cheerioObj(elem).text());
        if(str.length > 10){
            if(str.toUpperCase() == str){
                str+='.';
            }

            while(str.search(/\d\d\.\d\d\.\d\d/) > 0){
                var sub1 = str.substring(str.search(/\d\d\.\d\d\.\d\d/),str.search(/\d\d\.\d\d\.\d\d/)+8);
                console.log(sub1);
                var sub2 = sub1;
                sub2 = sub2.replace('.','-').replace('.','-');
                console.log(sub2);
                str = str.replace(sub1,sub2);
                console.log(str);
            }

            txtData += str;
        }
    });	
    txtData = txtData.split(/[:;!?.]+/);
    txtData = txtData.filter(function(line){
        return !(!line || line.length == 0 || line == " ")
    });
    return txtData;
}

var classes=[];

function Classify(resultTxt){
    var deferred = promise.defer();

    var q = queue();
    q.timeout = 10000;
    q.concurrency = 1;

    var resultClass = {};
    resultClass.phrases = [];
    resultClass.tokens = [];

    resultTxt.forEach(function(phrase,phIndex){
        q.push(function(cb) {
            if(phrase == "" || phrase == " "){
                cb();
                return;
            }
            
            console.log('-------------------------------------------------');
            console.log('Frase '+phIndex+' de '+(resultTxt.length-1)+': '+phrase+'\n');        
            var strClass = classifier.getClassifications(phrase);
            console.log(strClass);

            var manualClassify = true;
            if(!strClass || strClass.length == 0)
                manualClassify = true;
            else{
                strClass.forEach(function(clas){
                    if(clas.value > 0.9){
                        manualClassify = false;
                        resultClass.tokens.push(clas.label);
                        resultClass.phrases.push(phrase);
                        console.log("Classificada automaticamente como "+clas.label);
                    }else if(clas.value > 0.7){
                        var yorn = readlineSync.keyInYN('A classe '+clas.label+' se aplica?');
                        if(yorn){
                            manualClassify = false;
                            resultClass.tokens.push(clas.label);
                            resultClass.phrases.push(phrase);
                            console.log("Classificada automaticamente como "+clas.label);
                        }
                    }
                });
            }

            if(manualClassify){
                var answers=[];
                while(answers.length==0){
                    console.log('Escreva a classe manualmente:');
                    answers = readlineSync.prompt().split(',');
                }                

                answers.forEach(function(answer,answerIdx){
                    if( !(!answer || answer.length == 0 || answer == " ") ){
                        var numWords=-1;
                        if(answerIdx < answers.length-1){
                            console.log("------------------------------------");
                            console.log(phrase);
                            console.log('O token '+answer+' vai ate que palavra?');
                            numWords = readlineSync.prompt();
                        }
                        var pindex=phrase.length;
                        if(numWords != -1){
                            for (var l=0;l<phrase.length;l++) {
                                if (phrase.charAt(l) == " ") {
                                    if (!--numWords) {
                                        pindex= l;    
                                    }
                                }
                            }
                        }

                        var cutPhrase = phrase.substring(0,pindex);
                        phrase =  phrase.substring(pindex+1,phrase.length);

                        if(classes.indexOf(answer) == -1){
                            classes.push(answer);
                        }
                        console.log("registrando: \""+cutPhrase+"\" com "+"\""+answer+"\"");
                        classifier.add(cutPhrase, answer);
                        resultClass.tokens.push(answer);
                        resultClass.phrases.push(phrase);
                    }
                });
                
                classifier.train()
                .then(function(res){
                    cb();
                });
            }else{
                cb();
            }
        });
    });
    q.start(function(err) {
        deferred.resolve(resultClass);
        console.log('Finished classifing diagnosis!'.green);
    });
    return deferred.promise;
}