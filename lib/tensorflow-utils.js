var moment = require('moment');
var queue = require('queue');
var promise = require('q');
var schedule = require('node-schedule');
const tf = require('@tensorflow/tfjs-node');
var fs = require('fs');

//Recurrence rules
var updateRule = new schedule.RecurrenceRule();
updateRule.second = new schedule.Range(0, 59, 1);

var formatData={};
var neuralNetwork;
var predictions;
var loss=0;
var scheduleJob;

const INLINES_NUM = 20;
const OUTLINES_NUM = 3;

const INLINE_SIZE = 8;
const OUTLINE_SIZE = 3;

const TRAIN_BATCHES = 1;
const BATCH_SIZE = 200; 
const EPOCHS = 10; 

const TRAIN_RATE = 0.005;
const MIN_LOSS = 0.5;

var ALLTOKENS_LENGTH=0;

module.exports = {

    getOutLineSize: function(){
        return OUTLINE_SIZE;
    },

    InitTensorFlow: function(rawData, settings) {
        formatData.x = [];
        formatData.y = [];
        ALLTOKENS_LENGTH = settings.allTokens.length;

        neuralNetwork = createNN();
        
        for(var i=0;i<rawData.length;i++){
            var xRows = [];
            rawData[i].symptomList.forEach(function(symptom){
                var tokens = []
                symptom.forEach(function(token){
                    tokens.push( settings.allTokens.indexOf(token)/settings.allTokens.length );
                });
                if(tokens.length > INLINE_SIZE) tokens = tokens.splice(0,INLINE_SIZE);
                while(tokens.length < INLINE_SIZE)tokens.push(0);
                xRows.push(tokens);
            });  
            if(xRows.length > INLINES_NUM) xRows = xRows.splice(0,INLINES_NUM);
            while(xRows.length < INLINES_NUM) xRows.push( new Array(INLINE_SIZE).fill(0) );
            
            var yRows = [];

            for(var j=0;j<OUTLINES_NUM;j++){
                if( j<rawData[i].resultList.length ){
                    var result = rawData[i].resultList[j];
                    for(var k=0;k<OUTLINE_SIZE;k++){
                        var tokens = new Array(ALLTOKENS_LENGTH).fill(0);
                        if(k < result.length){
                            var token = result[k];
                            tokens[settings.allTokens.indexOf(token)] = 1;
                        }else{
                            tokens[0] = 1;
                        }
                        yRows.push(tokens);
                    }
                }else{
                    for(var k=0;k<OUTLINE_SIZE;k++){
                        var tokens = new Array(ALLTOKENS_LENGTH).fill(0);
                        tokens[0] = 1;
                        yRows.push(tokens);
                    }
                }
            }

            if(yRows.length > OUTLINES_NUM*OUTLINE_SIZE) yRows = yRows.splice(0,OUTLINES_NUM*OUTLINE_SIZE);
            while(yRows.length < OUTLINES_NUM*OUTLINE_SIZE) yRows.push(  new Array(ALLTOKENS_LENGTH).fill(0)  );
    
            formatData.y.push( yRows );
            formatData.x.push( xRows );
        }
    
        scheduleJob = schedule.scheduleJob(updateRule, function() {
            keepTraining();
        });
    },

    predict: function(rawData,settings){
        if(predictions != undefined)
            predictions.dispose;
        predictions = Array.from(Predictions(rawData,settings).dataSync());

        var result = [];
        var resRow = [];
        var count = 0;

        while(predictions.length > 0){
            var itemPred = predictions.splice(0,ALLTOKENS_LENGTH);
            var val = Math.max.apply(null, itemPred);

            resRow.push( {val:val,label:settings.allTokens[ itemPred.indexOf(val) ]} );
            count++;
            if(count % OUTLINE_SIZE == 0){
                result.push(resRow);
                resRow = [];
            }
        }

        return result;
    }

}

var updating=false;
function keepTraining(){
    if(!updating){
        updating=true;
        Training()
        .then(function(res){
            loss = res;
            if(loss < getMinLoss()){
                scheduleJob.cancel();
            }
            updating=false;
        });
    }
}

function getMinLoss(){
    try{
        var min = JSON.parse(fs.readFileSync("./data/tensorFlow.cfg")).minLoss;
        return min;
    } catch (err){
        return MIN_LOSS;
    }
}

//create NN structure
function createNN(){
    try{
        const model = tf.sequential({
        name: 'nn',
        layers: [
            
            tf.layers.dense({units: 70, activation: 'relu', inputShape: [INLINES_NUM,INLINE_SIZE]}),
            tf.layers.dense({units: 70, activation: 'relu'}),
            tf.layers.conv1d( { filters : 70, kernelSize: INLINES_NUM - OUTLINES_NUM*OUTLINE_SIZE + 1} ),
            tf.layers.dense({units: 70, activation: 'relu'}),
            tf.layers.dense({units: ALLTOKENS_LENGTH, activation:'softmax'})
        ]
        });
        model.compile(
            {loss: 'categoricalCrossentropy', optimizer: tf.train.adam(TRAIN_RATE)}
        );
        console.log("NN created!");
        return model;
    }catch(err){
        console.log("Error: "+err);
    }
}

//training function
async function Training(){
    if (formatData.x.length == 0 || formatData.y.length == 0) return null;
     
    console.log("Starting training");
  
    var tfX = tf.tensor3d(formatData.x);
    var tfY = tf.tensor3d(formatData.y);
    var loss;
    for (let i = 0; i < TRAIN_BATCHES; i++) {
        const history = await neuralNetwork.fit(
            tfX,
            tfY,
            {batchSize: BATCH_SIZE, epochs: EPOCHS, shuffle:true}
        );
        loss = history.history.loss[0];
      
    }
    return loss;
}

//prediction function
function Predictions(rawData,settings){
    var formatTestData = [];
    console.log("Get prediction");
    for(var i=0;i<rawData.length;i++){ 
        var xRows = [];
        rawData[i].symptomList.forEach(function(symptom){
            var tokens = []
            symptom.forEach(function(token){
                tokens.push( settings.allTokens.indexOf(token)/settings.allTokens.length );
            });
            if(tokens.length > INLINE_SIZE) tokens = tokens.splice(0,INLINE_SIZE);
            while(tokens.length < INLINE_SIZE)tokens.push(0);
            xRows.push(tokens);
        });  
        if(xRows.length > INLINES_NUM) xRows = xRows.splice(0,INLINES_NUM);
        while(xRows.length < INLINES_NUM) xRows.push( new Array(INLINE_SIZE).fill(0) );

        formatTestData.push( xRows );
    }
    
    var tfT = tf.tensor3d(formatTestData);
  
    const predictions = tf.tidy(() => 
        neuralNetwork.model.predict(tfT)
    );
    return predictions;
}

//util function
function map(x,in_min,in_max,out_min,out_max){
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}