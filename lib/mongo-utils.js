var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
mongoose.connect('mongodb://localhost:4002/diagnosis', { server: { poolSize: 5 }, useNewUrlParser: true });
var Diagnosis = require('../models/diagnosis-schema');
var moment = require('moment');
var queue = require('queue');
var promise = require('q');
var cheerio = require('cheerio');


mongoose.connection.on('disconnected', function(){
    console.log("DISCONECTED! Connecting again");
    mongoose.connect('mongodb://localhost:4002/diagnosis', { server: { poolSize: 5 }, useNewUrlParser: true });    
});

module.exports = {

    SaveDiagnosis: function( diagnosis){
        var deferred = promise.defer();
        var resultTxt = parseHtml(diagnosis[13]);
    
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
            resultadoTxt: resultTxt,
            resultadoHtml: diagnosis[13],
            tokenList: null,
            vtokenList: null,
            symptomList: null,
            resultList: null
        });
        diag.save(function(err,diagSaved) {
            if (err){
                console.log("Error saving diagnosis.");
                deferred.reject(err);
            }else{
                deferred.resolve(diagSaved);
            }
        });

        return deferred.promise;
    },
    
    UpdateDiagnosis: function( diag){
        var deferred = promise.defer();
        
        diag.save(function(err,diagSaved) {
            if (err){
                console.log("Error saving diagnosis.");
                deferred.reject(err);
            }else{
                deferred.resolve(diagSaved);
            }
        });

        return deferred.promise;
    },

    UpdateTokenList: function( diag,tokenList,vtokenList){
        var deferred = promise.defer();
        diag.tokenList = tokenList;
        diag.vtokenList = vtokenList;
        
        diag.save(function(err,diagSaved) {
            if (err){
                console.log("Error updating diagnosis token list.");
                deferred.reject(err);
            }else{
                deferred.resolve(diagSaved);
            }
        });

        return deferred.promise;
    },

    ResetingSRList: function( diag){
        var deferred = promise.defer();
        diag.resultList = null;
        diag.symptomList = null;
        
        diag.save(function(err,diagSaved) {
            if (err){
                console.log("Error updating diagnosis token list.");
                deferred.reject(err);
            }else{
                deferred.resolve(diagSaved);
            }
        });

        return deferred.promise;
    },

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
    },

    getAllDiagnosisPhrases: function(){
        var deferred = promise.defer();
        console.log('Getting all diagnosis');
        Diagnosis.find({},{tokenList:true,resultadoTxt:true})
        .exec()
        .then(function(diagnosis){
            console.log('Got all diagnosis');
            deferred.resolve(diagnosis);
        })
        .catch(function(err){
            deferred.reject('Error returning diagnosis. ' + err);
        });

        return deferred.promise;
    },

    getAllDiagnosisTokenLists: function(){
        var deferred = promise.defer();
        console.log('Getting all diagnosis');
        Diagnosis.find({},{tokenList:true,vtokenList:true})
        .exec()
        .then(function(diagnosis){
            console.log('Got all diagnosis');
            deferred.resolve(diagnosis);
        })
        .catch(function(err){
            deferred.reject('Error returning diagnosis. ' + err);
        });

        return deferred.promise;
    },

    getValidDiagnosis: function(id){
        var deferred = promise.defer();
        console.log('Getting a valid diagnosis');
        Diagnosis.find({})
        .exec()
        .then(function(diagnosis){
            console.log('Got diagnosis');
            deferred.resolve(diagnosis[id]);
        })
        .catch(function(err){
            deferred.reject('Error returning diagnosis. ' + err);
        });

        return deferred.promise;
    },

    getSomeDiagnosis: function(num){
        var deferred = promise.defer();
        console.log('Getting all diagnosis');
        Diagnosis.find({}).limit(num)
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
                var sub2 = sub1;
                sub2 = sub2.replace('.','-').replace('.','-');
                str = str.replace(sub1,sub2);
            }

            txtData += str;
        }
    });	
    txtData = txtData.split(/[:;!?.]+/);
    txtData = txtData.filter(function(line){
        return !(!line || line.length == 0 || line.match(/[A-Za-z]/i) == null)
    });
    return txtData;
}