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

var err = {
    code: 0,
    message: ''
};

var count = 0;

module.exports = {

    // Save sweeped contract from PredictIt site
    SaveDiagnosis: function( diagnosis){
        var deferred = promise.defer();

        var txtData = '';	
        var cheerioObj = cheerio.load(diagnosis[13]);
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

        var resultTxt = txtData.split(/[:;!?.]+/);
        console.log(resultTxt);

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
            symptomList: null,
            resultList: null
        });
        
        diag.save(function (err, diag) {
            if (err){
                console.log(err);
            }
            deferred.resolve(diag);
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
