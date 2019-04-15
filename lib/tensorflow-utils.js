var moment = require('moment');
var queue = require('queue');
var promise = require('q');
var schedule = require('node-schedule');
const tf = require('@tensorflow/tfjs-node');

//Recurrence rules
var updateRule = new schedule.RecurrenceRule();
updateRule.second = new schedule.Range(0, 59, 1);

var formatData={};
var neuralNetwork;
var predictions;
var loss=0;
var scheduleJob;

module.exports = {
    InitTensorFlow: function(rawData, minLoss, settings) {
        formatData.x = [];
        formatData.y = [];
        neuralNetwork = createNN();
        
        for(var i=0;i<rawData.length;i++){
            var xRows = [];
            rawData[i].symptomList.forEach(function(symptom){
                var tokens = []
                symptom.forEach(function(token){
                    tokens.push( settings.allTokens.indexOf(token)/settings.allTokens.length );
                });
                while(tokens.length < 6)tokens.push(0);
                xRows.push(tokens);
            });  
            if(xRows.length > 10) xRows = xRows.splice(0,10);
            while(xRows.length < 10) xRows.push([0,0,0,0,0,0]);
            
            var yRows = [];
            rawData[i].resultList.forEach(function(result){
                var tokens=[];
                result.forEach(function(token){
                    tokens.push( settings.allTokens.indexOf(token)/settings.allTokens.length );
                });
                while(tokens.length < 6)tokens.push(0);
                yRows.push(tokens);
            });  
            if(yRows.length > 10) yRows = yRows.splice(0,10);
            while(yRows.length < 10) yRows.push([0,0,0,0,0,0]);
    
            formatData.y.push( yRows );
            formatData.x.push( xRows );
        }
    
        scheduleJob = schedule.scheduleJob(updateRule, function() {
            keepTraining(minLoss);
        });
    },

    predict: function(rawData,settings){
        if(predictions != undefined)
            predictions.dispose;
        predictions = Array.from(Predictions(rawData,settings).dataSync());
        return predictions;
    }

}

var updating=false;
function keepTraining(minLoss){
    if(!updating){
        updating=true;
        Training()
        .then(function(res){
            loss = res;
            if(loss < minLoss){
                scheduleJob.cancel();
            }
            updating=false;
        });
    }
}

//create NN structure
function createNN(){
    const model = tf.sequential({
    name: 'nn',
    layers: [
        
        tf.layers.dense({units: 10, activation: 'relu', inputShape: [10,6]}),
        tf.layers.dense({units: 30, activation: 'relu'}),
        tf.layers.dense({units: 6, activation:'softmax'})
    ]
    });
    model.compile(
        {loss: 'categoricalCrossentropy', optimizer: tf.train.adam(0.01)}
    );
    console.log("NN created!");
    return model;
}

//training function
async function Training(){
    if (formatData.x.length == 0 || formatData.y.length == 0) return null;
    
    const TRAIN_BATCHES = 1;
    const BATCH_SIZE = 100;  
    console.log("Starting training");
  
    var tfX = tf.tensor3d(formatData.x);
    var tfY = tf.tensor3d(formatData.y);
    var loss;
    for (let i = 0; i < TRAIN_BATCHES; i++) {
        const history = await neuralNetwork.fit(
            tfX,
            tfY,
            {batchSize: BATCH_SIZE, epochs: 3}
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
            while(tokens.length < 6)tokens.push(0);
            xRows.push(tokens);
        });  
        if(xRows.length > 10) xRows = xRows.splice(0,10);
        while(xRows.length < 10) xRows.push([0,0,0,0,0,0]);

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